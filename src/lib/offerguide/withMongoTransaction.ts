import mongoose from "mongoose";
import dbConnect from "@/utils/dbConnect";

/**
 * Runs `work` inside a Mongo multi-document transaction (Sprint 10, Epic 10.2).
 *
 * FIRST TRANSACTION IN THIS CODEBASE — no prior pattern to copy, hence a shared
 * helper rather than session boilerplate inlined in one route. It exists because
 * activating a scoring version is two writes that must be atomic: turn every
 * other version off, turn the target on. A crash between them would leave zero
 * or two active versions, and `POST /evaluation-sessions` would then stamp new
 * sessions with the wrong config.
 *
 * SAFE HERE because every environment is MongoDB Atlas (per Sprint 4's DoD,
 * verification ran against Atlas), and Atlas provisions every tier — free M0
 * included — as a replica set, which is the requirement for transactions.
 * Mongoose 8 is well past the >=5.2 minimum.
 *
 * `withTransaction` handles commit, abort-on-throw, and the automatic retries
 * the driver does on transient transaction errors, so callers just do their
 * writes with `{ session }` and either return normally (commit) or throw
 * (abort). The session is always ended.
 */
export async function withMongoTransaction<T>(
  work: (session: mongoose.ClientSession) => Promise<T>
): Promise<T> {
  await dbConnect();

  const session = await mongoose.startSession();
  try {
    let result: T;
    await session.withTransaction(async () => {
      result = await work(session);
    });
    // `result` is assigned inside withTransaction before it resolves; the
    // definite-assignment cast reflects that the commit path always ran it.
    return result!;
  } finally {
    await session.endSession();
  }
}
