CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_configs" (
	"id" text PRIMARY KEY DEFAULT 'default_config' NOT NULL,
	"provider" text DEFAULT 'google_gemini' NOT NULL,
	"model" text DEFAULT 'gemini-2.5-flash' NOT NULL,
	"api_key" text DEFAULT '' NOT NULL,
	"custom_endpoint" text DEFAULT '',
	"temperature" double precision DEFAULT 0.2 NOT NULL,
	"max_tokens" integer DEFAULT 4096 NOT NULL,
	"auto_scan_enabled" boolean DEFAULT true NOT NULL,
	"auto_scan_interval_minutes" integer DEFAULT 15 NOT NULL,
	"auto_generate_scripts" boolean DEFAULT true NOT NULL,
	"notify_on_anomaly" boolean DEFAULT true NOT NULL,
	"connection_status" text DEFAULT 'connected' NOT NULL,
	"last_tested_at" timestamp,
	"response_time_ms" integer DEFAULT 215,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_log_anomalies" (
	"id" text PRIMARY KEY NOT NULL,
	"source_device" text NOT NULL,
	"category" text NOT NULL,
	"severity" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"log_sample" text NOT NULL,
	"root_cause" text NOT NULL,
	"impact" text NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "alert_rules" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"device_id" text,
	"metric" text NOT NULL,
	"condition" text NOT NULL,
	"threshold" text NOT NULL,
	"duration_seconds" integer DEFAULT 60 NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"escalation_tier" integer DEFAULT 1 NOT NULL,
	"notify_email" boolean DEFAULT true NOT NULL,
	"notify_sound" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "alerts" (
	"id" text PRIMARY KEY NOT NULL,
	"device_id" text NOT NULL,
	"device_name" text NOT NULL,
	"ip_address" text NOT NULL,
	"message" text NOT NULL,
	"severity" text NOT NULL,
	"triggered_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp,
	"acknowledged" boolean DEFAULT false NOT NULL,
	"acknowledged_by" text,
	"resolved_by" text,
	"resolution_notes" text
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"user_name" text NOT NULL,
	"user_role" text NOT NULL,
	"action" text NOT NULL,
	"details" text NOT NULL,
	"ip_address" text NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auto_discovered_devices" (
	"id" text PRIMARY KEY NOT NULL,
	"ip" text NOT NULL,
	"mac" text NOT NULL,
	"suggested_name" text NOT NULL,
	"type" text NOT NULL,
	"snmp_detected" boolean DEFAULT false NOT NULL,
	"vendor" text NOT NULL,
	"response_time" integer DEFAULT 5 NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"discovered_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "device_interfaces" (
	"id" text PRIMARY KEY NOT NULL,
	"device_id" text NOT NULL,
	"name" text NOT NULL,
	"type" text DEFAULT 'ethernet' NOT NULL,
	"status" text DEFAULT 'up' NOT NULL,
	"mac_address" text,
	"speed_mbps" integer DEFAULT 1000,
	"mtu" integer DEFAULT 1500,
	"rx_bytes" double precision DEFAULT 0,
	"tx_bytes" double precision DEFAULT 0,
	"rx_errors" integer DEFAULT 0,
	"tx_errors" integer DEFAULT 0,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "device_metrics" (
	"id" text PRIMARY KEY NOT NULL,
	"device_id" text NOT NULL,
	"metric_name" text NOT NULL,
	"metric_label" text,
	"value" double precision NOT NULL,
	"unit" text NOT NULL,
	"collected_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "device_optimization_plans" (
	"id" text PRIMARY KEY NOT NULL,
	"device_name" text NOT NULL,
	"device_ip" text NOT NULL,
	"category" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"impact_score" integer NOT NULL,
	"cli_script" text NOT NULL,
	"applied" boolean DEFAULT false NOT NULL,
	"applied_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "device_status_history" (
	"id" text PRIMARY KEY NOT NULL,
	"device_id" text NOT NULL,
	"status" text NOT NULL,
	"checked_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "devices" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"ip_address" text NOT NULL,
	"mac_address" text,
	"model" text,
	"location_id" text,
	"location_name" text,
	"is_priority" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'online' NOT NULL,
	"last_seen" timestamp DEFAULT now() NOT NULL,
	"uptime" text DEFAULT '0 menit',
	"cpu_usage" integer DEFAULT 0,
	"ram_usage" integer DEFAULT 0,
	"storage_usage" integer DEFAULT 0,
	"temperature" integer DEFAULT 0,
	"latency" integer DEFAULT 1,
	"packet_loss" integer DEFAULT 0,
	"parent_device_id" text,
	"snmp_version" text DEFAULT 'v2c',
	"snmp_community" text DEFAULT 'public',
	"coord_x" integer DEFAULT 400,
	"coord_y" integer DEFAULT 300,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lan_route_recommendations" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"target_subnet" text NOT NULL,
	"current_route" text NOT NULL,
	"recommended_route" text NOT NULL,
	"current_bottleneck" text NOT NULL,
	"expected_improvement" text NOT NULL,
	"vlan_id" integer,
	"priority" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"building" text NOT NULL,
	"floor" text NOT NULL,
	"description" text,
	"device_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"alert_id" text NOT NULL,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "queue_traffics" (
	"id" text PRIMARY KEY NOT NULL,
	"device_id" text NOT NULL,
	"name" text NOT NULL,
	"target_subnet" text NOT NULL,
	"max_limit_download_mbps" double precision NOT NULL,
	"max_limit_upload_mbps" double precision NOT NULL,
	"current_download_mbps" double precision DEFAULT 0 NOT NULL,
	"current_upload_mbps" double precision DEFAULT 0 NOT NULL,
	"packet_drops_per_sec" integer DEFAULT 0 NOT NULL,
	"queue_type" text DEFAULT 'default-small' NOT NULL,
	"priority" integer DEFAULT 8 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "repair_records" (
	"id" text PRIMARY KEY NOT NULL,
	"ticket_code" text NOT NULL,
	"device_id" text NOT NULL,
	"device_name" text NOT NULL,
	"ip_address" text NOT NULL,
	"user_id" text NOT NULL,
	"user_name" text NOT NULL,
	"problem" text NOT NULL,
	"action" text NOT NULL,
	"result" text NOT NULL,
	"status" text DEFAULT 'berjalan' NOT NULL,
	"photo_urls" json DEFAULT '[]'::json NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "repair_records_ticket_code_unique" UNIQUE("ticket_code")
);
--> statement-breakpoint
CREATE TABLE "report_schedules" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"frequency" text NOT NULL,
	"format" text DEFAULT 'pdf' NOT NULL,
	"recipients" json DEFAULT '[]'::json NOT NULL,
	"created_by" text NOT NULL,
	"last_sent_at" timestamp,
	"next_run_at" timestamp NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "snmp_configs" (
	"id" text PRIMARY KEY NOT NULL,
	"device_id" text NOT NULL,
	"version" text DEFAULT 'v2c' NOT NULL,
	"community" text DEFAULT 'public',
	"username" text,
	"auth_protocol" text,
	"auth_key" text,
	"privacy_protocol" text,
	"privacy_key" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"role" text DEFAULT 'petugas' NOT NULL,
	"phone" text,
	"status" text DEFAULT 'active' NOT NULL,
	"last_login" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vpn_tunnels" (
	"id" text PRIMARY KEY NOT NULL,
	"device_id" text NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"user" text NOT NULL,
	"remote_ip" text NOT NULL,
	"status" text DEFAULT 'connected' NOT NULL,
	"uptime" text DEFAULT '0s',
	"bytes_in" double precision DEFAULT 0,
	"bytes_out" double precision DEFAULT 0,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_device_id_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "device_interfaces" ADD CONSTRAINT "device_interfaces_device_id_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "device_metrics" ADD CONSTRAINT "device_metrics_device_id_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "device_status_history" ADD CONSTRAINT "device_status_history_device_id_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "devices" ADD CONSTRAINT "devices_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_alert_id_alerts_id_fk" FOREIGN KEY ("alert_id") REFERENCES "public"."alerts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "queue_traffics" ADD CONSTRAINT "queue_traffics_device_id_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repair_records" ADD CONSTRAINT "repair_records_device_id_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repair_records" ADD CONSTRAINT "repair_records_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "snmp_configs" ADD CONSTRAINT "snmp_configs_device_id_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vpn_tunnels" ADD CONSTRAINT "vpn_tunnels_device_id_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("id") ON DELETE cascade ON UPDATE no action;