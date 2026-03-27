package config

import (
	"fmt"
	"os"
	"strings"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	AppPort string
	GinMode string
	TrustedProxies []string

	DBHost     string
	DBPort     string
	DBUser     string
	DBPassword string
	DBName     string
	DBSSLMode  string
	DBTimezone string

	JWTAccessSecret  string
	JWTRefreshSecret string
	AccessExpireMin  int
	RefreshExpireH   int

	ResendAPIKey string
	ResendFrom   string
}

func Load() (*Config, error) {
	_ = godotenv.Load()

	accessMin, err := atoiWithDefault("JWT_ACCESS_EXPIRE_MINUTES", 30)
	if err != nil {
		return nil, err
	}
	refreshHours, err := atoiWithDefault("JWT_REFRESH_EXPIRE_HOURS", 168)
	if err != nil {
		return nil, err
	}

	cfg := &Config{
		AppPort: getEnv("APP_PORT", "8080"),
		GinMode: getEnv("GIN_MODE", "debug"),
		TrustedProxies: getEnvSlice(
			"TRUSTED_PROXIES",
			[]string{"127.0.0.1", "::1"},
		),

		DBHost:     getEnv("DB_HOST", "127.0.0.1"),
		DBPort:     getEnv("DB_PORT", "5432"),
		DBUser:     getEnv("DB_USER", "app_user"),
		DBPassword: getEnv("DB_PASSWORD", "app_pass"),
		DBName:     getEnv("DB_NAME", "app_db"),
		DBSSLMode:  getEnv("DB_SSLMODE", "disable"),
		DBTimezone: getEnv("DB_TIMEZONE", "Asia/Shanghai"),

		JWTAccessSecret:  getEnv("JWT_ACCESS_SECRET", "dev-access-secret"),
		JWTRefreshSecret: getEnv("JWT_REFRESH_SECRET", "dev-refresh-secret"),
		AccessExpireMin:  accessMin,
		RefreshExpireH:   refreshHours,

		ResendAPIKey: getEnv("RESEND_API_KEY", ""),
		ResendFrom:   getEnv("RESEND_FROM_EMAIL", "onboarding@resend.dev"),
	}

	return cfg, nil
}

func (c *Config) DSN() string {
	return fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=%s TimeZone=%s",
		c.DBHost, c.DBUser, c.DBPassword, c.DBName, c.DBPort, c.DBSSLMode, c.DBTimezone,
	)
}

func getEnv(key, fallback string) string {
	if val, ok := os.LookupEnv(key); ok && val != "" {
		return val
	}
	return fallback
}

func atoiWithDefault(key string, fallback int) (int, error) {
	raw := getEnv(key, strconv.Itoa(fallback))
	v, err := strconv.Atoi(raw)
	if err != nil {
		return 0, fmt.Errorf("%s must be number: %w", key, err)
	}
	return v, nil
}

func getEnvSlice(key string, fallback []string) []string {
	raw, ok := os.LookupEnv(key)
	if !ok || strings.TrimSpace(raw) == "" {
		return fallback
	}

	parts := strings.Split(raw, ",")
	values := make([]string, 0, len(parts))
	for _, part := range parts {
		v := strings.TrimSpace(part)
		if v != "" {
			values = append(values, v)
		}
	}
	if len(values) == 0 {
		return fallback
	}
	return values
}
