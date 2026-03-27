package middleware

import (
	"net/http"
	"strings"

	"new-apps/backend/internal/service"

	"github.com/gin-gonic/gin"
)

func AuthRequired(authSvc *service.AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "missing token"})
			return
		}
		token := strings.TrimPrefix(authHeader, "Bearer ")
		userID, err := authSvc.ParseAccessToken(token)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "invalid token"})
			return
		}
		c.Set("userID", userID)
		c.Next()
	}
}
