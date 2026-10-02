import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { mintGuestToken, resolveIdentity, setGuestCookie,
} from "@/lib/offerguide/identity";
import { badRequest, notFound } from "@/lib/offerguide/errors";
import { findCandidateProfile, identityWhereClause } from "@/lib/offerguide/profile";
import { serializeDecimals } from "@/lib/offerguide/serialize";


// 1) GET /candidate-profile — "Do I already have a saved profile?"
// This runs when the page loads, to pre-fill the form if the person filled it before.

// 1. Figure out who you are (resolveIdentity).
// 2. If we've NEVER seen you → make a brand-new guest ticket right now.
// 3. Look in the database for a profile belonging to this identity.
// 4. If no profile found → return 404 ("nothing saved yet")   ← NOT an error!
//  If found → return the saved profile data.
// 5. Either way: if we made a new ticket in step 2, attach it as a cookie
// so the browser remembers you next time.

// export async function GET(req: NextRequest) {
//   let identity = resolveIdentity(req);
//   let mintedGuestToken: string | null = null;

//   if (!identity) {
//     mintedGuestToken = mintGuestToken();
//     identity = { type: "guest", guestToken: mintedGuestToken };
//   }

//   const profile = await findCandidateProfile(identity);

//   if (!profile) {
//     const response = notFound();
//     if (mintedGuestToken) setGuestCookie(response, mintedGuestToken);
//     return response;
//   }

//   const response = NextResponse.json(serializeDecimals(profile));
//   if (mintedGuestToken) setGuestCookie(response, mintedGuestToken);
//   return response;
// }

export async function GET(req: NextRequest) {
  try {
    let identity = resolveIdentity(req);
    let mintedGuestToken: string | null = null;

    if (!identity) {
      mintedGuestToken = mintGuestToken();
      identity = {
        type: "guest",
        guestToken: mintedGuestToken,
      };
    }

    console.log("[OfferGuide Profile GET] identity:", {
      type: identity.type,
      hasGuestToken:
        identity.type === "guest" ? Boolean(identity.guestToken) : false,
      userInfoId:
        identity.type === "user" ? identity.userInfoId : undefined,
    });

    const profile = await findCandidateProfile(identity);

    if (!profile) {
      console.log("[OfferGuide Profile GET] No profile found");

      const response = notFound();

      if (mintedGuestToken) {
        setGuestCookie(response, mintedGuestToken);
      }

      return response;
    }

    console.log("[OfferGuide Profile GET] Profile found:", profile.id);

    const response = NextResponse.json(
      serializeDecimals(profile)
    );

    if (mintedGuestToken) {
      setGuestCookie(response, mintedGuestToken);
    }

    return response;
  } catch (error) {
    console.error("[OfferGuide Profile GET] FAILED");

    if (error instanceof Error) {
      console.error("Name:", error.name);
      console.error("Message:", error.message);
      console.error("Stack:", error.stack);
    } else {
      console.error(error);
    }

    return NextResponse.json(
      {
        error: "Candidate profile database request failed.",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (!body.careerStage || !body.preferredWorkArrangement) {
    return badRequest(
      "careerStage and preferredWorkArrangement are required."
    );
  }

  let identity = resolveIdentity(req);
  let mintedGuestToken: string | null = null;

  if (!identity) {
    mintedGuestToken = mintGuestToken();
    identity = { type: "guest", guestToken: mintedGuestToken };
  }

  const existing = await findCandidateProfile(identity);
  if (existing) {
    return badRequest("A profile already exists for this identity — use PATCH instead.");
  }

  const profile = await prisma.candidateProfile.create({
    data: {
      ...identityWhereClause(identity),
      careerStage: body.careerStage,
      careerStageOtherText: body.careerStageOtherText ?? null,
      careerSwitcher: body.careerSwitcher ?? null,
      targetFunctionalDomain: body.targetFunctionalDomain ?? null,
      currentCountry: body.currentCountry ?? null,
      currentCity: body.currentCity ?? null,
      preferredWorkArrangement: body.preferredWorkArrangement,
      preferredWorkLocation: body.preferredWorkLocation ?? null,
      preferredCountry: body.preferredCountry ?? null,
      preferredLocationText: body.preferredLocationText ?? null,
      willingToRelocate: body.willingToRelocate ?? "Not sure",
      currentWorkArrangement: body.currentWorkArrangement ?? "On-site",
      currentJobTitle: body.currentJobTitle ?? null,
      employmentType: body.employmentType ?? null,
      employmentStatus: body.employmentStatus ?? null,
      currentBaseSalary: body.currentBaseSalary ?? null,
      currentCurrency: body.currentCurrency ?? null,
      payFrequency: body.payFrequency ?? null,
      workingHoursPerWeek: body.workingHoursPerWeek ?? null,
      averageDailyCommuteMinutes: body.averageDailyCommuteMinutes ?? null,
      currentBenefits: body.currentBenefits ?? undefined,
      overallJobSatisfaction: body.overallJobSatisfaction ?? null,
      careerGrowthSatisfaction: body.careerGrowthSatisfaction ?? null,
      workLifeBalanceSatisfaction: body.workLifeBalanceSatisfaction ?? null,
      consentSettings: body.consentSettings ?? undefined,
    },
  });

  const response = NextResponse.json(serializeDecimals(profile), { status: 201 });
  if (mintedGuestToken) setGuestCookie(response, mintedGuestToken);
  return response;
}

export async function PATCH(req: NextRequest) {
  const identity = resolveIdentity(req);
  if (!identity) return notFound();

  const existing = await findCandidateProfile(identity);
  if (!existing) return notFound();

  const body = await req.json();
  const {
    careerStage,
    careerStageOtherText,
    careerSwitcher,
    targetFunctionalDomain,
    currentCountry,
    currentCity,
    preferredWorkArrangement,
    preferredWorkLocation,
    preferredCountry,
    preferredLocationText,
    willingToRelocate,
    currentWorkArrangement,
    currentJobTitle,
    employmentType,
    employmentStatus,
    currentBaseSalary,
    currentCurrency,
    payFrequency,
    workingHoursPerWeek,
    averageDailyCommuteMinutes,
    currentBenefits,
    overallJobSatisfaction,
    careerGrowthSatisfaction,
    workLifeBalanceSatisfaction,
  } = body;

  const profile = await prisma.candidateProfile.update({
    where: { id: existing.id },
    data: {
      ...(careerStage !== undefined && { careerStage }),
      ...(careerStageOtherText !== undefined && { careerStageOtherText }),
      ...(careerSwitcher !== undefined && { careerSwitcher }),
      ...(targetFunctionalDomain !== undefined && { targetFunctionalDomain }),
      ...(currentCountry !== undefined && { currentCountry }),
      ...(currentCity !== undefined && { currentCity }),
      ...(preferredWorkArrangement !== undefined && { preferredWorkArrangement }),
      ...(preferredWorkLocation !== undefined && { preferredWorkLocation }),
      ...(preferredCountry !== undefined && { preferredCountry }),
      ...(preferredLocationText !== undefined && { preferredLocationText }),
      ...(willingToRelocate !== undefined && { willingToRelocate }),
      ...(currentWorkArrangement !== undefined && { currentWorkArrangement }),
      ...(currentJobTitle !== undefined && { currentJobTitle }),
      ...(employmentType !== undefined && { employmentType }),
      ...(employmentStatus !== undefined && { employmentStatus }),
      ...(currentBaseSalary !== undefined && { currentBaseSalary }),
      ...(currentCurrency !== undefined && { currentCurrency }),
      ...(payFrequency !== undefined && { payFrequency }),
      ...(workingHoursPerWeek !== undefined && { workingHoursPerWeek }),
      ...(averageDailyCommuteMinutes !== undefined && { averageDailyCommuteMinutes }),
      ...(currentBenefits !== undefined && { currentBenefits }),
      ...(overallJobSatisfaction !== undefined && { overallJobSatisfaction }),
      ...(careerGrowthSatisfaction !== undefined && { careerGrowthSatisfaction }),
      ...(workLifeBalanceSatisfaction !== undefined && { workLifeBalanceSatisfaction }),
    },
  });

  return NextResponse.json(serializeDecimals(profile));
}