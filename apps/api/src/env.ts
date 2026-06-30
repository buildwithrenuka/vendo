/// <reference types="@cloudflare/workers-types" />

declare global {
  interface Env {
    DB: D1Database;
    APP_URL: string;
    API_URL?: string;
    FROM_EMAIL: string;
    SESSION_SECRET: string;
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
    OIDC_CLIENT_ID: string;
    OIDC_CLIENT_SECRET: string;
    OIDC_ISSUER: string;
    OIDC_AUTHORIZATION_URL?: string;
    OIDC_TOKEN_URL?: string;
    OIDC_USERINFO_URL?: string;
    RESEND_API_KEY?: string;
    OPENAI_API_KEY?: string;
    RAZORPAY_KEY_ID?: string;
    RAZORPAY_KEY_SECRET?: string;
    GITHUB_TOKEN?: string;
    GITHUB_REPO?: string;
    DEV_EMAILS?: string;
    VENDO_ADMIN_USERNAME?: string;
    VENDO_ADMIN_PASSWORD?: string;
    /** Jal adapts to host product — vendo | travel | generic */
    JAL_PROFILE?: string;
    JAL_PRODUCT_NAME?: string;
    JAL_PRODUCT_CONTEXT?: string;
    JAL_STACK_CONTEXT?: string;
    JAL_EXISTING_FEATURES?: string;
    JAL_OUT_OF_SCOPE?: string;
    JAL_USER_LABELS?: string;
    JAL_FEEDBACK_URL?: string;
    /** @deprecated use JAL_* */
    SHIPFLOW_PROFILE?: string;
    SHIPFLOW_PRODUCT_NAME?: string;
    SHIPFLOW_PRODUCT_CONTEXT?: string;
    SHIPFLOW_STACK_CONTEXT?: string;
    SHIPFLOW_EXISTING_FEATURES?: string;
    SHIPFLOW_OUT_OF_SCOPE?: string;
    SHIPFLOW_USER_LABELS?: string;
    SHIPFLOW_FEEDBACK_URL?: string;
  }
}

export {};
