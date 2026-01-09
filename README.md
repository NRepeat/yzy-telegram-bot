# yzy-bot

This project is a Telegram bot built with NestJS and Telegraf. It uses Prisma for database interactions with a PostgreSQL database.

## Description

A Telegram bot for managing groups and broadcasts.

## How it Works

The bot provides an interface for administrators to manage broadcasts to multiple Telegram groups efficiently. The workflow is as follows:

1.  **Authentication**: An admin starts a chat with the bot and is authenticated.
2.  **Main Menu**: The admin is presented with a main menu with options to manage groups directly or to manage group sets.

### Direct Group Management

-   **Selection**: The admin can select one or more groups from a list of all available groups.
-   **Broadcast**: After selecting the desired groups, the admin can write a message and send it to all selected groups simultaneously.

### Group Set Management

To streamline the process of sending messages to the same collection of groups repeatedly, the bot allows for the creation and management of "group sets".

-   **Create a Set**: An admin can create a new group set by giving it a name.
-   **Add/Remove Groups**: Groups can be added to or removed from a set at any time.
-   **Manage Sets**: Admins can rename or delete group sets as needed.
-   **Broadcast to a Set**: Instead of selecting individual groups each time, an admin can simply select a group set to broadcast a message to all the groups it contains.

## Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/your-username/yzy-bot.git
    cd yzy-bot
    ```

2.  Install dependencies:
    ```bash
    pnpm install
    ```

3.  Set up your environment variables by creating a `.env` file from the example:
    ```bash
    cp .env.example .env
    ```
    Update the `.env` file with your specific configuration, especially `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_URL`, and your database settings.

4.  Apply database migrations:
    ```bash
    pnpm run setup
    ```

## Running the app

### Development

```bash
pnpm run start:dev
```

### Production

```bash
pnpm run start:prod
```

## Test

```bash
pnpm run test
```

## Environment Variables

The following environment variables are required:

-   `TELEGRAM_BOT_TOKEN`: Your Telegram bot token.
-   `TELEGRAM_WEBHOOK_URL`: The webhook URL for your Telegram bot.
-   `DATABASE_NAME`: The name of your PostgreSQL database.
-   `DATABASE_HOST`: The host of your PostgreSQL database.
-   `DATABASE_USER`: The username for your PostgreSQL database.
-   `DATABASE_PASS`: The password for your PostgreSQL database.
-   `DATABASE_PORT`: The port for your PostgreSQL database.
-   `ADMIN_KEY`: A key for admin access.

You can also set the `DATABASE_URL` directly.

## License

This project is [UNLICENSED](LICENSE).