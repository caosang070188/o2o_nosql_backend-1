# O2O AUTHENTICATION
## Single Sign On


## 1. Run source code.

### 1.1. Install Node (Current version is v13.14.0)
### 1.2. Clone source code from git; git clone <url_repository>
### 1.3. Run commandline: npm install for install package usage in project
### 1.4. Install PM2: npm install -g pm2 --> PM2 support run proxy like a services in OS.
### 1.5. Run proxy nodejs by pm2: pm2 start "npm run start:dev" --name BackEnd
### 1.6. Setup nginx (or apache) with option proxy_pass to nodejs proxy (nginx). You had setup in server 45.119.83.73.

## 2. API:

### 2.1. Swagger: Swagger have full information api authentication.
### 2.2. Structure source code: 
#### 2.2.1. Controller will redirect routers in nodejs.
#### 2.2.2. Services will handle function in once router.

### 2.3. Package: I think I used Joi is not popular package. You can read more about this package in https://www.npmjs.com/package/joi.