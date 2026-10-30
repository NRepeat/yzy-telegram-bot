-- CreateTable
CREATE TABLE "TrackedMessage" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "chat_id" BIGINT NOT NULL,
    "chat_title" TEXT,
    "message_id" INTEGER NOT NULL,
    "text" TEXT,
    "sent_at" TIMESTAMP(3) NOT NULL,
    "reply_to_message_id" INTEGER,
    "reply_to_username" TEXT,
    "reply_to_text" TEXT,
    "reply_to_sent_at" TIMESTAMP(3),
    "response_seconds" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrackedMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TrackedMessage_chat_id_message_id_key" ON "TrackedMessage"("chat_id", "message_id");

-- CreateIndex
CREATE INDEX "TrackedMessage_username_sent_at_idx" ON "TrackedMessage"("username", "sent_at");
