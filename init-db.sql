-- RevPay Database Initialization
CREATE DATABASE IF NOT EXISTS revpay_users;
CREATE DATABASE IF NOT EXISTS revpay_wallets;
CREATE DATABASE IF NOT EXISTS revpay_transactions;
CREATE DATABASE IF NOT EXISTS revpay_invoices;
CREATE DATABASE IF NOT EXISTS revpay_loans;
CREATE DATABASE IF NOT EXISTS revpay_notifications;

GRANT ALL PRIVILEGES ON revpay_users.* TO 'root'@'%';
GRANT ALL PRIVILEGES ON revpay_wallets.* TO 'root'@'%';
GRANT ALL PRIVILEGES ON revpay_transactions.* TO 'root'@'%';
GRANT ALL PRIVILEGES ON revpay_invoices.* TO 'root'@'%';
GRANT ALL PRIVILEGES ON revpay_loans.* TO 'root'@'%';
GRANT ALL PRIVILEGES ON revpay_notifications.* TO 'root'@'%';
FLUSH PRIVILEGES;
