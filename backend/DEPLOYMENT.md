# Deploy Backend to Heroku with Docker

## Prerequisites

1. Install [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli)
2. Install [Docker](https://www.docker.com/get-started)
3. Have a Heroku account

## Step-by-Step Deployment

### 1. Login to Heroku

```bash
heroku login
```

### 2. Create a new Heroku app

```bash
cd backend
heroku create your-sweet-shop-backend
```

### 3. Set stack to container (for Docker)

```bash
heroku stack:set container -a your-sweet-shop-backend
```

### 4. Add PostgreSQL database

```bash
heroku addons:create heroku-postgresql:essential-0 -a your-sweet-shop-backend
```

### 5. Set environment variables

```bash
heroku config:set NODE_ENV=production -a your-sweet-shop-backend
```

### 6. Deploy to Heroku

```bash
git add .
git commit -m "Add Docker configuration for Heroku deployment"
git push heroku main
```

### 7. Run database migrations

```bash
heroku run bun prisma migrate deploy -a your-sweet-shop-backend
```

### 8. Open your app

```bash
heroku open -a your-sweet-shop-backend
```

## Important Notes

1. **Database URL**: Heroku automatically sets `DATABASE_URL` environment variable when you add PostgreSQL addon
2. **Port**: Heroku automatically sets `PORT` environment variable
3. **Migrations**: Run `heroku run bun prisma migrate deploy` after each deployment that includes schema changes

## Local Testing with Docker

Before deploying, you can test locally:

```bash
# Build and run with docker-compose
docker-compose up --build

# Or build and run with just Docker
docker build -t sweet-shop-backend .
docker run -p 5000:5000 sweet-shop-backend
```

## Useful Heroku Commands

```bash
# View logs
heroku logs --tail -a your-sweet-shop-backend

# Open bash in running container
heroku run bash -a your-sweet-shop-backend

# Run prisma studio (if needed)
heroku run bun prisma studio -a your-sweet-shop-backend

# Scale dynos
heroku ps:scale web=1 -a your-sweet-shop-backend

# View app info
heroku apps:info -a your-sweet-shop-backend
```

## Troubleshooting

1. **Build fails**: Check `heroku logs --tail` for error messages
2. **Database connection**: Ensure `DATABASE_URL` is set correctly
3. **Port issues**: Make sure your app listens on `process.env.PORT`

## Environment Variables

Your app will automatically get these from Heroku:

- `DATABASE_URL` - PostgreSQL connection string
- `PORT` - Port to listen on

Add any additional environment variables using:

```bash
heroku config:set VARIABLE_NAME=value -a your-sweet-shop-backend
```
