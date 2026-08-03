-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ANALYST', 'ADMIN');

-- CreateEnum
CREATE TYPE "Chain" AS ENUM ('ETHEREUM', 'SOLANA', 'ARBITRUM', 'BASE', 'BSC', 'HYPERLIQUID');

-- CreateEnum
CREATE TYPE "LabelCategory" AS ENUM ('CEX', 'DEX', 'MARKET_MAKER', 'VC_FUND', 'WHALE', 'SMART_MONEY', 'BOT');

-- CreateEnum
CREATE TYPE "AlertEventType" AS ENUM ('TRANSFER', 'EXCHANGE_DEPOSIT', 'EXCHANGE_WITHDRAWAL', 'HYPER_POSITION', 'SMART_MONEY_ACCUMULATION');

-- CreateEnum
CREATE TYPE "PositionSide" AS ENUM ('LONG', 'SHORT');

-- CreateEnum
CREATE TYPE "OrderSide" AS ENUM ('BUY', 'SELL');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallets" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "chain" "Chain" NOT NULL,
    "is_smart_money" BOOLEAN NOT NULL DEFAULT false,
    "smart_money_score" DOUBLE PRECISION DEFAULT 0.0,
    "win_rate_30d" DOUBLE PRECISION DEFAULT 0.0,
    "total_pnl_usd" DECIMAL(18,2) DEFAULT 0.0,
    "first_active_at" TIMESTAMP(3),
    "last_active_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_labels" (
    "id" TEXT NOT NULL,
    "wallet_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "category" "LabelCategory" NOT NULL,
    "confidence_score" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_labels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exchange_labels" (
    "id" TEXT NOT NULL,
    "exchange_name" TEXT NOT NULL,
    "hot_wallet_address" TEXT NOT NULL,
    "chain" "Chain" NOT NULL,
    "deposit_tag_prefix" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exchange_labels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transfers" (
    "id" TEXT NOT NULL,
    "chain" "Chain" NOT NULL,
    "block_number" BIGINT NOT NULL,
    "block_timestamp" TIMESTAMP(3) NOT NULL,
    "tx_hash" TEXT NOT NULL,
    "from_address" TEXT NOT NULL,
    "to_address" TEXT NOT NULL,
    "from_wallet_id" TEXT,
    "to_wallet_id" TEXT,
    "token_address" TEXT NOT NULL,
    "token_symbol" TEXT NOT NULL,
    "raw_amount" DECIMAL(36,18) NOT NULL,
    "amount_usd" DECIMAL(18,2) NOT NULL,
    "is_exchange_deposit" BOOLEAN NOT NULL DEFAULT false,
    "is_exchange_withdrawal" BOOLEAN NOT NULL DEFAULT false,
    "is_smart_money_activity" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "event_type" "AlertEventType" NOT NULL,
    "chain" "Chain",
    "target_address" TEXT,
    "min_amount_usd" DECIMAL(18,2) NOT NULL DEFAULT 100000,
    "channels" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "watchlists" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "wallet_id" TEXT,
    "wallet_address" TEXT NOT NULL,
    "chain" "Chain" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "watchlists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hyper_positions" (
    "id" TEXT NOT NULL,
    "wallet_id" TEXT,
    "user_address" TEXT NOT NULL,
    "coin" TEXT NOT NULL,
    "position_size" DECIMAL(18,6) NOT NULL,
    "entry_price" DECIMAL(18,6) NOT NULL,
    "mark_price" DECIMAL(18,6) NOT NULL,
    "liquidation_price" DECIMAL(18,6),
    "unrealized_pnl" DECIMAL(18,2) NOT NULL,
    "leverage" INTEGER NOT NULL,
    "side" "PositionSide" NOT NULL,
    "is_whale" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hyper_positions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hyper_trades" (
    "id" TEXT NOT NULL,
    "wallet_id" TEXT,
    "user_address" TEXT NOT NULL,
    "coin" TEXT NOT NULL,
    "side" "OrderSide" NOT NULL,
    "price" DECIMAL(18,6) NOT NULL,
    "size" DECIMAL(18,6) NOT NULL,
    "usd_value" DECIMAL(18,2) NOT NULL,
    "fee" DECIMAL(18,6) NOT NULL,
    "trade_timestamp" TIMESTAMP(3) NOT NULL,
    "hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hyper_trades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "alert_id" TEXT,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "theme" TEXT NOT NULL DEFAULT 'dark',
    "default_currency" TEXT NOT NULL DEFAULT 'USD',
    "telegram_chat_id" TEXT,
    "discord_webhook_url" TEXT,
    "email_notifications" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key_hash" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "rate_limit_rpm" INTEGER NOT NULL DEFAULT 60,
    "expires_at" TIMESTAMP(3),
    "last_used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "wallets_address_key" ON "wallets"("address");

-- CreateIndex
CREATE INDEX "wallets_chain_address_idx" ON "wallets"("chain", "address");

-- CreateIndex
CREATE INDEX "wallets_is_smart_money_smart_money_score_idx" ON "wallets"("is_smart_money", "smart_money_score");

-- CreateIndex
CREATE INDEX "wallets_last_active_at_idx" ON "wallets"("last_active_at");

-- CreateIndex
CREATE INDEX "wallet_labels_wallet_id_idx" ON "wallet_labels"("wallet_id");

-- CreateIndex
CREATE INDEX "wallet_labels_category_idx" ON "wallet_labels"("category");

-- CreateIndex
CREATE INDEX "wallet_labels_label_idx" ON "wallet_labels"("label");

-- CreateIndex
CREATE INDEX "exchange_labels_exchange_name_idx" ON "exchange_labels"("exchange_name");

-- CreateIndex
CREATE UNIQUE INDEX "exchange_labels_chain_hot_wallet_address_key" ON "exchange_labels"("chain", "hot_wallet_address");

-- CreateIndex
CREATE INDEX "transfers_chain_block_timestamp_idx" ON "transfers"("chain", "block_timestamp");

-- CreateIndex
CREATE INDEX "transfers_from_address_block_timestamp_idx" ON "transfers"("from_address", "block_timestamp");

-- CreateIndex
CREATE INDEX "transfers_to_address_block_timestamp_idx" ON "transfers"("to_address", "block_timestamp");

-- CreateIndex
CREATE INDEX "transfers_token_address_amount_usd_idx" ON "transfers"("token_address", "amount_usd");

-- CreateIndex
CREATE INDEX "transfers_is_exchange_deposit_amount_usd_idx" ON "transfers"("is_exchange_deposit", "amount_usd");

-- CreateIndex
CREATE INDEX "transfers_is_exchange_withdrawal_amount_usd_idx" ON "transfers"("is_exchange_withdrawal", "amount_usd");

-- CreateIndex
CREATE INDEX "transfers_is_smart_money_activity_amount_usd_idx" ON "transfers"("is_smart_money_activity", "amount_usd");

-- CreateIndex
CREATE INDEX "transfers_tx_hash_idx" ON "transfers"("tx_hash");

-- CreateIndex
CREATE INDEX "alerts_user_id_is_active_idx" ON "alerts"("user_id", "is_active");

-- CreateIndex
CREATE INDEX "alerts_event_type_is_active_idx" ON "alerts"("event_type", "is_active");

-- CreateIndex
CREATE INDEX "watchlists_user_id_idx" ON "watchlists"("user_id");

-- CreateIndex
CREATE INDEX "watchlists_chain_wallet_address_idx" ON "watchlists"("chain", "wallet_address");

-- CreateIndex
CREATE INDEX "hyper_positions_user_address_coin_idx" ON "hyper_positions"("user_address", "coin");

-- CreateIndex
CREATE INDEX "hyper_positions_coin_is_whale_position_size_idx" ON "hyper_positions"("coin", "is_whale", "position_size");

-- CreateIndex
CREATE INDEX "hyper_positions_updated_at_idx" ON "hyper_positions"("updated_at");

-- CreateIndex
CREATE INDEX "hyper_trades_user_address_trade_timestamp_idx" ON "hyper_trades"("user_address", "trade_timestamp");

-- CreateIndex
CREATE INDEX "hyper_trades_coin_trade_timestamp_idx" ON "hyper_trades"("coin", "trade_timestamp");

-- CreateIndex
CREATE INDEX "hyper_trades_usd_value_idx" ON "hyper_trades"("usd_value");

-- CreateIndex
CREATE INDEX "notifications_user_id_is_read_sent_at_idx" ON "notifications"("user_id", "is_read", "sent_at");

-- CreateIndex
CREATE UNIQUE INDEX "settings_user_id_key" ON "settings"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_key_hash_key" ON "api_keys"("key_hash");

-- CreateIndex
CREATE INDEX "api_keys_key_hash_idx" ON "api_keys"("key_hash");

-- CreateIndex
CREATE INDEX "api_keys_user_id_idx" ON "api_keys"("user_id");

-- AddForeignKey
ALTER TABLE "wallet_labels" ADD CONSTRAINT "wallet_labels_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_from_wallet_id_fkey" FOREIGN KEY ("from_wallet_id") REFERENCES "wallets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_to_wallet_id_fkey" FOREIGN KEY ("to_wallet_id") REFERENCES "wallets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watchlists" ADD CONSTRAINT "watchlists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watchlists" ADD CONSTRAINT "watchlists_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hyper_positions" ADD CONSTRAINT "hyper_positions_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hyper_trades" ADD CONSTRAINT "hyper_trades_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_alert_id_fkey" FOREIGN KEY ("alert_id") REFERENCES "alerts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settings" ADD CONSTRAINT "settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
