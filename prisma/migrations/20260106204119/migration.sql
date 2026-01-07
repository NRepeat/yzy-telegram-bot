-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL,
    "username" TEXT,
    "is_admin" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Group" (
    "id" SERIAL NOT NULL,
    "chat_id" BIGINT NOT NULL,
    "title" TEXT NOT NULL,

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupSet" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "GroupSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupSetItem" (
    "id" SERIAL NOT NULL,
    "setId" INTEGER NOT NULL,
    "chat_id" BIGINT NOT NULL,

    CONSTRAINT "GroupSetItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Broadcast" (
    "id" SERIAL NOT NULL,
    "text" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Broadcast_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BroadcastMessage" (
    "id" SERIAL NOT NULL,
    "broadcastId" INTEGER NOT NULL,
    "chat_id" BIGINT NOT NULL,
    "message_id" INTEGER NOT NULL,

    CONSTRAINT "BroadcastMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Group_chat_id_key" ON "Group"("chat_id");

-- CreateIndex
CREATE UNIQUE INDEX "GroupSet_name_key" ON "GroupSet"("name");

-- AddForeignKey
ALTER TABLE "GroupSetItem" ADD CONSTRAINT "GroupSetItem_setId_fkey" FOREIGN KEY ("setId") REFERENCES "GroupSet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BroadcastMessage" ADD CONSTRAINT "BroadcastMessage_broadcastId_fkey" FOREIGN KEY ("broadcastId") REFERENCES "Broadcast"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
