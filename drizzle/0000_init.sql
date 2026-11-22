CREATE TABLE `accounts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`balance_cents` integer DEFAULT 0 NOT NULL,
	`closing_day` integer,
	`due_day` integer
);
--> statement-breakpoint
CREATE TABLE `budgets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`category_key` text NOT NULL,
	`cycle_key` text NOT NULL,
	`limit_cents` integer NOT NULL,
	FOREIGN KEY (`category_key`) REFERENCES `categories`(`key`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `budgets_category_cycle` ON `budgets` (`category_key`,`cycle_key`);--> statement-breakpoint
CREATE TABLE `categories` (
	`key` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`kind` text NOT NULL,
	`family` text NOT NULL,
	`icon` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `pot_moves` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`pot_id` integer NOT NULL,
	`date` text NOT NULL,
	`amount_cents` integer NOT NULL,
	FOREIGN KEY (`pot_id`) REFERENCES `savings_pots`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `savings_pots` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`goal_cents` integer,
	`balance_cents` integer DEFAULT 0 NOT NULL,
	`color` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`account_id` integer NOT NULL,
	`date` text NOT NULL,
	`amount_cents` integer NOT NULL,
	`description` text NOT NULL,
	`category_key` text,
	`source` text NOT NULL,
	`user_categorized` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`category_key`) REFERENCES `categories`(`key`) ON UPDATE no action ON DELETE no action
);
