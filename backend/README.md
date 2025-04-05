# AgroConnect Backend API

RESTful API for AgroConnect - connecting agricultural producers with technical service providers.

## Technologies Used

- Node.js
- Express.js
- PostgreSQL
- Sequelize ORM
- JSON Web Tokens (JWT)
- Firebase Cloud Messaging (FCM)

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- PostgreSQL

## Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Configure environment variables:
   - Create a `.env` file in the root directory
   - Copy the contents from `.env.example` and update with your values

4. Set up the database:

```bash
# Create database
npx sequelize-cli db:create

# Run migrations
npm run migrate
# or
yarn migrate
```

## Running the Application

### Development

```bash
npm run dev
# or
yarn dev
```

### Production

```bash
npm start
# or
yarn start
```

## Project Structure

```
/backend
  ├── /src
  │    ├── /controllers      # Request handlers
  │    │     ├── authController.js
  │    │     ├── announcementController.js
  │    │     ├── offerController.js
  │    │     └── reviewController.js
  │    ├── /middlewares      # Express middlewares
  │    │     ├── authMiddleware.js
  │    │     └── validateRequest.js
  │    ├── /models           # Sequelize models
  │    │     ├── index.js
  │    │     ├── User.js
  │    │     ├── Announcement.js
  │    │     ├── Offer.js
  │    │     └── Review.js
  │    ├── /routes           # API routes
  │    │     ├── auth.js
  │    │     ├── announcements.js
  │    │     ├── offers.js
  │    │     └── reviews.js
  │    ├── /migrations       # Database migrations
  │    ├── /services         # Business logic and external services
  │    ├── /utils            # Utility functions
  │    ├── config.js         # Application configuration
  │    ├── app.js            # Express application setup
  │    └── server.js         # Server entry point
  ├── .env                   # Environment variables
  ├── .env.example           # Example environment variables
  └── package.json           # Project dependencies
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/password` - Change password
- `DELETE /api/auth/account` - Delete account

### Announcements

- `GET /api/announcements` - Get all announcements
- `GET /api/announcements/:id` - Get announcement by ID
- `POST /api/announcements` - Create announcement
- `PUT /api/announcements/:id` - Update announcement
- `DELETE /api/announcements/:id` - Delete announcement
- `GET /api/announcements/user/me` - Get user announcements

### Offers

- `POST /api/offers` - Create offer
- `GET /api/offers/:id` - Get offer by ID
- `PUT /api/offers/:id/status` - Update offer status
- `GET /api/offers/user/me` - Get user offers
- `GET /api/offers/user/received` - Get received offers
- `GET /api/offers/announcement/:id` - Get announcement offers

### Reviews

- `POST /api/reviews` - Create review
- `GET /api/reviews/check/:offerId` - Check if user can review an offer
- `GET /api/reviews/given` - Get reviews given by user
- `GET /api/reviews/received` - Get reviews received by user
- `GET /api/reviews/user/:id` - Get user reviews

## Database Schema

### Users

- id (PK)
- name
- email (unique)
- password (hashed)
- userType (enum: 'produtor', 'técnico')
- phone
- location
- profileImage
- fcmToken
- rating
- reviewCount
- active
- createdAt
- updatedAt
- deletedAt

### Announcements

- id (PK)
- userId (FK)
- title
- description
- price
- location
- category (enum: 'Maquinário', 'Consultoria', 'Serviços', 'Insumos', 'Outros')
- images
- acceptCounterOffers
- status (enum: 'active', 'pending', 'completed', 'cancelled')
- views
- createdAt
- updatedAt
- deletedAt

### Offers

- id (PK)
- userId (FK)
- announcementId (FK)
- price
- message
- status (enum: 'pending', 'accepted', 'rejected', 'completed')
- buyerReviewed
- sellerReviewed
- createdAt
- updatedAt
- deletedAt

### Reviews

- id (PK)
- reviewerId (FK)
- reviewedId (FK)
- offerId (FK)
- rating
- comment
- reviewerType (enum: 'buyer', 'seller')
- createdAt
- updatedAt
- deletedAt

## License

MIT
