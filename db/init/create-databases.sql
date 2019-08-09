DROP DATABASE IF EXISTS ae_middleware;
CREATE DATABASE ae_middleware ENCODING 'UTF-8';

DROP DATABASE IF EXISTS ae_middleware_test;
CREATE DATABASE ae_middleware_test ENCODING 'UTF-8';

DROP USER IF EXISTS ae_middleware;
CREATE USER ae_middleware WITH PASSWORD 'password';

DROP USER IF EXISTS ae_middleware_test;
CREATE USER ae_middleware_test WITH PASSWORD 'password';