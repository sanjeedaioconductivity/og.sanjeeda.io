-- CreateTable
CREATE TABLE `candidate_profiles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userinfo_id` INTEGER NULL,
    `guest_token` VARCHAR(191) NULL,
    `career_stage` VARCHAR(191) NOT NULL,
    `career_stage_other_text` VARCHAR(191) NULL,
    `career_switcher` VARCHAR(191) NULL,
    `target_functional_domain` VARCHAR(191) NULL,
    `current_country` VARCHAR(191) NULL,
    `current_city` VARCHAR(191) NULL,
    `preferred_work_arrangement` VARCHAR(191) NOT NULL,
    `preferred_work_location` VARCHAR(191) NULL,
    `preferred_country` VARCHAR(191) NULL,
    `preferred_location_text` VARCHAR(191) NULL,
    `current_work_arrangement` VARCHAR(191) NULL DEFAULT 'On-site',
    `employment_type` VARCHAR(191) NULL,
    `employment_status` VARCHAR(191) NULL,
    `current_base_salary` DECIMAL(14, 2) NULL,
    `current_currency` VARCHAR(191) NULL,
    `pay_frequency` VARCHAR(191) NULL,
    `working_hours_per_week` INTEGER NULL,
    `average_daily_commute_minutes` INTEGER NULL,
    `current_benefits` JSON NULL,
    `consent_settings` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `candidate_profiles_userinfo_id_key`(`userinfo_id`),
    UNIQUE INDEX `candidate_profiles_guest_token_key`(`guest_token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `evaluation_sessions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `candidate_profile_id` INTEGER NOT NULL,
    `evaluation_type` VARCHAR(191) NOT NULL DEFAULT 'New job offer',
    `evaluation_offer_count` VARCHAR(191) NOT NULL,
    `evaluation_priorities` JSON NOT NULL,
    `evaluation_priority_other_text` VARCHAR(191) NULL,
    `scoring_config_version` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `offers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `evaluation_session_id` INTEGER NOT NULL,
    `label` VARCHAR(191) NULL,
    `company_name` VARCHAR(191) NULL,
    `role_title` VARCHAR(191) NULL,
    `offer_country` VARCHAR(191) NULL,
    `offer_city` VARCHAR(191) NULL,
    `offer_work_arrangement` VARCHAR(191) NOT NULL,
    `offer_employment_type` VARCHAR(191) NOT NULL,
    `offer_contract_duration` VARCHAR(191) NULL,
    `offer_probation` VARCHAR(191) NULL DEFAULT 'Not clear',
    `reporting_level` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `offer_compensation` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `offer_id` INTEGER NOT NULL,
    `offer_base_salary` DECIMAL(14, 2) NOT NULL,
    `offer_pay_period` VARCHAR(191) NOT NULL DEFAULT 'Monthly',
    `offer_currency` VARCHAR(191) NOT NULL,
    `offer_gross_net` VARCHAR(191) NULL,
    `offer_take_home` DECIMAL(14, 2) NULL,
    `offer_signing_bonus` DECIMAL(14, 2) NULL,
    `offer_annual_bonus` DECIMAL(14, 2) NULL,
    `offer_annual_bonus_type` VARCHAR(191) NULL DEFAULT '% of base',
    `offer_commission` DECIMAL(14, 2) NULL,
    `offer_commission_type` VARCHAR(191) NULL,
    `offer_equity` DECIMAL(14, 2) NULL,
    `offer_equity_type` VARCHAR(191) NULL,
    `offer_transport_allowance` DECIMAL(14, 2) NULL,
    `offer_transport_frequency` VARCHAR(191) NULL,
    `offer_other_allowance` DECIMAL(14, 2) NULL,
    `offer_other_allowance_frequency` VARCHAR(191) NULL,
    `offer_relocation_support` VARCHAR(191) NULL,
    `offer_relocation_amount` DECIMAL(14, 2) NULL,
    `offer_review_cycle` VARCHAR(191) NULL,
    `offer_negotiation_room` VARCHAR(191) NULL DEFAULT 'Not sure',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `offer_compensation_offer_id_key`(`offer_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `offer_benefits_security` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `offer_id` INTEGER NOT NULL,
    `offer_health_coverage` VARCHAR(191) NULL,
    `offer_life_insurance` VARCHAR(191) NULL,
    `offer_retirement_benefits` VARCHAR(191) NULL,
    `offer_annual_leave_days` INTEGER NULL,
    `offer_sick_leave` VARCHAR(191) NULL,
    `offer_parental_leave` VARCHAR(191) NULL,
    `offer_education_reimbursement` VARCHAR(191) NULL,
    `offer_device_support` VARCHAR(191) NULL,
    `offer_meal_support` VARCHAR(191) NULL,
    `offer_wellness_benefits` VARCHAR(191) NULL,
    `offer_visa_support` VARCHAR(191) NULL,
    `offer_job_security` VARCHAR(191) NULL,
    `offer_restrictive_clause` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `offer_benefits_security_offer_id_key`(`offer_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `offer_worklife` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `offer_id` INTEGER NOT NULL,
    `offer_working_hours` INTEGER NULL,
    `offer_weekend_work` VARCHAR(191) NULL DEFAULT 'Not clear',
    `offer_travel_requirement` VARCHAR(191) NULL,
    `offer_hybrid_days` VARCHAR(191) NULL DEFAULT 'Not applicable',
    `offer_commute_minutes` INTEGER NULL,
    `offer_time_flexibility` VARCHAR(191) NULL,
    `offer_wfh_support` VARCHAR(191) NULL,
    `offer_overtime_compensation` VARCHAR(191) NULL,
    `offer_after_hours_availability` VARCHAR(191) NULL,
    `offer_leave_flexibility` VARCHAR(191) NULL,
    `offer_personal_energy` VARCHAR(191) NULL,
    `offer_worklife_importance` VARCHAR(191) NULL DEFAULT 'Medium',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `offer_worklife_offer_id_key`(`offer_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `offer_growth` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `offer_id` INTEGER NOT NULL,
    `offer_learning_budget` VARCHAR(191) NULL,
    `offer_training_support` VARCHAR(191) NULL,
    `offer_brand_value` INTEGER NULL DEFAULT 3,
    `offer_skill_potential` INTEGER NULL DEFAULT 3,
    `offer_goal_match` INTEGER NULL DEFAULT 3,
    `offer_promotion_path` VARCHAR(191) NULL,
    `offer_mentorship` VARCHAR(191) NULL,
    `offer_strong_leaders` VARCHAR(191) NULL,
    `offer_internal_mobility` VARCHAR(191) NULL DEFAULT 'Not clear',
    `offer_role_scope` VARCHAR(191) NULL DEFAULT 'Not clear',
    `offer_promotion_timeline` VARCHAR(191) NULL,
    `offer_growth_importance` INTEGER NULL DEFAULT 3,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `offer_growth_offer_id_key`(`offer_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `offer_culture` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `offer_id` INTEGER NOT NULL,
    `offer_manager_impression` VARCHAR(191) NULL,
    `offer_team_culture_fit` INTEGER NULL DEFAULT 3,
    `offer_red_flags` JSON NULL,
    `offer_notes` TEXT NULL,
    `offer_values_alignment` INTEGER NULL DEFAULT 3,
    `offer_inclusion_confidence` VARCHAR(191) NULL,
    `offer_work_pressure` VARCHAR(191) NULL,
    `offer_company_reputation` VARCHAR(191) NULL,
    `offer_leadership_stability` VARCHAR(191) NULL,
    `offer_employer_treatment_signal` VARCHAR(191) NULL,
    `offer_leadership_style` VARCHAR(191) NULL,
    `offer_psych_safety` VARCHAR(191) NULL,
    `offer_purpose_sense` INTEGER NULL DEFAULT 3,
    `offer_culture_importance` INTEGER NULL DEFAULT 3,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `offer_culture_offer_id_key`(`offer_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `offer_scores` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `offer_id` INTEGER NOT NULL,
    `salary_score` INTEGER NOT NULL,
    `benefits_score` INTEGER NOT NULL,
    `stability_score` INTEGER NOT NULL,
    `worklife_score` INTEGER NOT NULL,
    `growth_score` INTEGER NOT NULL,
    `culture_score` INTEGER NOT NULL,
    `purpose_score` INTEGER NOT NULL,
    `overall_score` INTEGER NOT NULL,
    `recommendation_label` VARCHAR(191) NOT NULL,
    `score_breakdown` JSON NOT NULL,
    `scoring_config_version` INTEGER NOT NULL,
    `field_scoring_rules_version` INTEGER NOT NULL,
    `computed_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `offer_scores_offer_id_key`(`offer_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `evaluation_sessions` ADD CONSTRAINT `evaluation_sessions_candidate_profile_id_fkey` FOREIGN KEY (`candidate_profile_id`) REFERENCES `candidate_profiles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `offers` ADD CONSTRAINT `offers_evaluation_session_id_fkey` FOREIGN KEY (`evaluation_session_id`) REFERENCES `evaluation_sessions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `offer_compensation` ADD CONSTRAINT `offer_compensation_offer_id_fkey` FOREIGN KEY (`offer_id`) REFERENCES `offers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `offer_benefits_security` ADD CONSTRAINT `offer_benefits_security_offer_id_fkey` FOREIGN KEY (`offer_id`) REFERENCES `offers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `offer_worklife` ADD CONSTRAINT `offer_worklife_offer_id_fkey` FOREIGN KEY (`offer_id`) REFERENCES `offers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `offer_growth` ADD CONSTRAINT `offer_growth_offer_id_fkey` FOREIGN KEY (`offer_id`) REFERENCES `offers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `offer_culture` ADD CONSTRAINT `offer_culture_offer_id_fkey` FOREIGN KEY (`offer_id`) REFERENCES `offers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `offer_scores` ADD CONSTRAINT `offer_scores_offer_id_fkey` FOREIGN KEY (`offer_id`) REFERENCES `offers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

