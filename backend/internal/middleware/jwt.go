package middleware

import (
	"net/http"
	"strings"

	"new-apps/backend/internal/i18n"
	"new-apps/backend/internal/service"

	"github.com/gin-gonic/gin"
)

func AuthRequired(authSvc *service.AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			i18n.ErrorJSON(c, http.StatusUnauthorized, i18n.ErrMissingToken)
			c.Abort()
			return
		}
		token := strings.TrimPrefix(authHeader, "Bearer ")
		userID, err := authSvc.ParseAccessToken(token)
		if err != nil {
			i18n.ErrorJSON(c, http.StatusUnauthorized, i18n.ErrInvalidToken)
			c.Abort()
			return
		}
		c.Set("userID", userID)
		c.Next()
	}
}
