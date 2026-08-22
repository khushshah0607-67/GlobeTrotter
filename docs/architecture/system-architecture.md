# GlobeTrotter — System Architecture

## Overview

GlobeTrotter is a personalized multi-city travel planning web application.

The system will use a client-server architecture consisting of:

- React + TypeScript frontend
- FastAPI backend
- PostgreSQL relational database
- Optional external services/APIs where required

## High-Level Architecture

```text
User
  |
  v
React + TypeScript Frontend
  |
  | HTTP / REST API
  v
FastAPI Backend
  |
  +--> API Routes
  |
  +--> Services
  |
  +--> Repositories
  |
  v
PostgreSQL Database

FastAPI Services
  |
  +--> External APIs / Services (if required)