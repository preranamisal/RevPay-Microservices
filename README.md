# RevPay — Cloud-Native Microservices Financial Platform

> **End-to-End Modernization of a Monolithic Financial Platform to Cloud-Native Microservices on AWS**

A full-stack, production-ready financial application built with **Java 17 + Spring Boot 3 + Spring Cloud + Angular 17 + MySQL + Docker + AWS**.

---

## 📐 Architecture Overview

```
                          ┌─────────────────────────────────────────────┐
                          │           Angular Frontend (Port 4200)       │
                          └─────────────────────┬───────────────────────┘
                                                │ HTTP/REST
                          ┌─────────────────────▼───────────────────────┐
                          │        API Gateway  (Port 8080)              │
                          │   JWT Auth · Rate Limiting · Circuit Breaker │
                          └──┬──────┬──────┬──────┬──────┬──────┬───────┘
                             │      │      │      │      │      │
                   ┌─────────▼─┐ ┌──▼───┐ ┌▼───┐ ┌▼────┐ ┌▼──┐ ┌▼──────┐
                   │  User Svc │ │Wallet│ │Txn │ │Inv  │ │Ln │ │Notif  │
                   │  :8081    │ │:8082 │ │:8083│ │:8084│ │:85│ │:8086  │
                   └─────┬─────┘ └──┬───┘ └┬───┘ └┬────┘ └┬──┘ └───────┘
                         │          │      │      │      │
                   ┌─────▼──────────▼──────▼──────▼──────▼─────────┐
                   │                  MySQL (Port 3306)               │
                   │  revpay_users · wallets · transactions · ...     │
                   └─────────────────────────────────────────────────┘
                         │
                   ┌─────▼──────────┐
                   │  Eureka Server  │  Service Discovery  :8761
                   └────────────────┘
```

---

## 🧩 Microservices

| Service              | Port | Database              | Responsibility |
|----------------------|------|-----------------------|----------------|
| **eureka-server**    | 8761 | —                     | Service registry & discovery |
| **api-gateway**      | 8080 | —                     | JWT auth, routing, rate-limiting, circuit breaker |
| **user-service**     | 8081 | `revpay_users`        | Auth, RBAC, profile, KYC, PIN management |
| **wallet-service**   | 8082 | `revpay_wallets`      | Wallet CRUD, add/withdraw, payment methods |
| **transaction-service** | 8083 | `revpay_transactions` | Send/request money, history, filters |
| **invoice-service**  | 8084 | `revpay_invoices`     | Create/send/pay invoices, analytics |
| **loan-service**     | 8085 | `revpay_loans`        | Loan application, EMI schedule, repayments |
| **notification-service** | 8086 | `revpay_notifications` | Real-time notifications, alerts |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Language** | Java 17 |
| **Framework** | Spring Boot 3.2, Spring Cloud 2023.0 |
| **Service Discovery** | Netflix Eureka |
| **API Gateway** | Spring Cloud Gateway + Resilience4j |
| **Inter-Service Comms** | OpenFeign |
| **Database** | MySQL 8.0 (per-service schema) |
| **Security** | JWT (jjwt 0.11.5), BCrypt |
| **Build** | Maven 3.9 |
| **Logging** | Log4J2 |
| **Testing** | JUnit 4.13.2 + Mockito |
| **Frontend** | Angular 17 (Standalone Components, Signals) |
| **Containerization** | Docker + Docker Compose |
| **CI/CD** | GitHub Actions |
| **Cloud** | AWS EC2 (App) + AWS RDS (MySQL) + AWS S3 (Documents) |
| **IDE** | VSCode |

---

## 🚀 Quick Start

### Prerequisites
- Java 17
- Maven 3.9+
- Docker & Docker Compose
- Node.js 20+ & npm
- MySQL 8.0 (or use Docker)

### Option 1: Run with Docker Compose (Recommended)

```bash
# Clone the repository
git clone https://github.com/yourusername/revpay.git
cd revpay

# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f user-service
```

**Access points:**
- Frontend: http://localhost:4200
- API Gateway: http://localhost:8080
- Eureka Dashboard: http://localhost:8761 (admin / revpay@2024)

### Option 2: Run Locally (Development)

```bash
# 1. Start MySQL
mysql -u root -p
# Run init-db.sql to create all databases

# 2. Start Eureka Server
cd eureka-server && mvn spring-boot:run

# 3. Start all backend services (in separate terminals)
cd user-service        && mvn spring-boot:run
cd wallet-service      && mvn spring-boot:run
cd transaction-service && mvn spring-boot:run
cd invoice-service     && mvn spring-boot:run
cd loan-service        && mvn spring-boot:run
cd notification-service && mvn spring-boot:run

# 4. Start API Gateway
cd api-gateway && mvn spring-boot:run

# 5. Start Angular frontend
cd revpay-frontend
npm install
npm start
# Opens http://localhost:4200
```

---

## 🔐 API Endpoints

### Authentication (User Service)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login, returns JWT |
| GET  | `/api/users/{id}` | Get user profile |
| PUT  | `/api/users/{id}/profile` | Update profile |
| PUT  | `/api/users/{id}/password` | Change password |
| POST | `/api/users/{id}/pin` | Set transaction PIN |
| GET  | `/api/users/search?query=` | Search users |

### Wallet
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/wallets/create/{userId}` | Create wallet |
| GET  | `/api/wallets/{userId}` | Get wallet & balance |
| POST | `/api/wallets/{userId}/add-funds` | Add funds |
| POST | `/api/wallets/{userId}/withdraw` | Withdraw funds |
| GET  | `/api/payment-methods/{userId}` | List payment methods |
| POST | `/api/payment-methods/{userId}` | Add payment method |

### Transactions
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/transactions/send` | Send money |
| POST | `/api/transactions/request` | Request money |
| POST | `/api/transactions/requests/{id}/accept` | Accept request |
| POST | `/api/transactions/requests/{id}/reject` | Reject request |
| GET  | `/api/transactions/user/{userId}` | Get history (paginated, filtered) |
| GET  | `/api/transactions/user/{userId}/summary` | Get 30-day summary |

### Invoices
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/invoices` | Create invoice |
| POST | `/api/invoices/{id}/send` | Send invoice |
| POST | `/api/invoices/{id}/pay` | Pay invoice |
| GET  | `/api/invoices/business/{userId}` | Business invoices |
| GET  | `/api/invoices/business/{userId}/analytics` | Revenue analytics |

### Loans
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/loans/apply` | Apply for loan |
| GET  | `/api/loans/user/{userId}` | My loans |
| GET  | `/api/loans/{id}/emi-schedule` | EMI schedule |
| POST | `/api/loans/{id}/repay` | Make repayment |
| GET  | `/api/loans/user/{userId}/analytics` | Loan analytics |

---

## 🧪 Running Tests

```bash
# Run all tests
mvn test

# Run specific service tests
cd user-service        && mvn test
cd wallet-service      && mvn test
cd transaction-service && mvn test

# Test report location
target/surefire-reports/
```

---

## ☁️ AWS Deployment

### Infrastructure

```
AWS Region: ap-south-1 (Mumbai)

EC2:   t3.medium (App Server) — runs Docker containers
RDS:   MySQL 8.0 db.t3.micro — managed database
S3:    revpay-documents — loan document uploads
VPC:   Private subnets for RDS, public for EC2
SG:    Port 80/443 open, 8761/8080-8086 internal only
```

### Deploy to EC2

```bash
# 1. Configure GitHub Secrets:
#    AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
#    EC2_HOST, EC2_SSH_KEY
#    DOCKER_USERNAME, DOCKER_PASSWORD

# 2. Push to main branch — GitHub Actions handles the rest
git push origin main

# Pipeline:
# ✓ Build & test all Maven modules
# ✓ Build Docker images
# ✓ Push to Docker Hub
# ✓ SSH deploy to EC2
# ✓ docker-compose up -d
```

### RDS Configuration
Update `application.yml` in each service for RDS:
```yaml
spring:
  datasource:
    url: jdbc:mysql://<rds-endpoint>:3306/revpay_users?useSSL=true
    username: admin
    password: ${DB_PASSWORD}  # from AWS Secrets Manager
```

---

## 📁 Project Structure

```
revpay/
├── pom.xml                      # Parent POM
├── docker-compose.yml           # All services + MySQL
├── init-db.sql                  # Database initialization
├── .github/workflows/ci-cd.yml  # GitHub Actions pipeline
│
├── eureka-server/               # Service registry (8761)
├── api-gateway/                 # Gateway + JWT auth (8080)
├── user-service/                # Auth + users (8081)
│   ├── src/main/java/com/revpay/user/
│   │   ├── controller/          # REST endpoints
│   │   ├── service/             # Business logic
│   │   ├── repository/          # JPA repositories
│   │   ├── entity/              # JPA entities
│   │   ├── dto/                 # Request/Response DTOs
│   │   ├── security/            # JWT utilities
│   │   ├── config/              # Security config
│   │   └── exception/           # Global handlers
│   └── src/test/                # JUnit4 tests
│
├── wallet-service/              # Wallet + payments (8082)
├── transaction-service/         # Transfers (8083)
├── invoice-service/             # Invoicing (8084)
├── loan-service/                # Business loans (8085)
├── notification-service/        # Alerts (8086)
│
└── revpay-frontend/             # Angular 17 SPA
    ├── src/app/
    │   ├── core/                # Services, guards, interceptors
    │   └── features/            # Auth, Dashboard, Wallet, Txn, Invoice, Loan, Profile
    ├── Dockerfile               # Multi-stage: Node build + Nginx serve
    └── nginx.conf               # Production SPA routing
```

---

## 🔑 Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Personal | john.doe@revpay.com | Demo@1234 |
| Business | business@revpay.com | Demo@1234 |

> ⚠️ Change all passwords and secrets before production deployment.

---

## 🌐 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `JWT_SECRET` | revpay-secret-key... | JWT signing key |
| `SPRING_DATASOURCE_URL` | jdbc:mysql://localhost:3306/... | DB URL |
| `SPRING_DATASOURCE_PASSWORD` | revpay@2024 | DB password |
| `EUREKA_CLIENT_SERVICEURL_DEFAULTZONE` | http://eureka-server:8761/eureka/ | Eureka URL |

---

## 👨‍💻 Development Notes

- **IDE:** VSCode with Extension Pack for Java, Spring Boot Dashboard
- **Database migrations:** Spring JPA `ddl-auto: update` (use Flyway for production)
- **Logging:** Log4J2, logs written to `logs/<service-name>.log`
- **Ports summary:** Eureka 8761 → Gateway 8080 → Services 8081–8086 → Frontend 4200

---

*Built with ❤️ as a demonstration of cloud-native microservices architecture.*
