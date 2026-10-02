-- AlterTable: SCR-003 fields that were missing from the Sprint 3 schema draft
-- despite being in the FRS/OpenAPI field inventory (offerFunctionalDomain, offerReceivedDate).
ALTER TABLE `offers`
  ADD COLUMN `offer_functional_domain` VARCHAR(191) NULL,
  ADD COLUMN `offer_received_date` DATE NULL;
