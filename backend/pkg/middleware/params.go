package middleware

import (
	"context"
	"log"
	"net/http"
	"regexp"
	"time"
)

// URLParams represents URL parameters extracted from the path
type URLParams map[string]string

// contextKey is used to store URL parameters in request context
type contextKey string

const urlParamsKey contextKey = "urlParams"

// WithURLParams adds URL parameters to the request context
func WithURLParams(r *http.Request, params URLParams) *http.Request {
	ctx := context.WithValue(r.Context(), urlParamsKey, params)
	return r.WithContext(ctx)
}

// GetURLParams extracts URL parameters from the request context
func GetURLParams(r *http.Request) URLParams {
	if params, ok := r.Context().Value(urlParamsKey).(URLParams); ok {
		return params
	}
	return make(URLParams)
}

// GetURLParam gets a single URL parameter from the request
func GetURLParam(r *http.Request, key string) string {
	params := GetURLParams(r)
	return params[key]
}

// Middleware wrapper functions
func WithTimeout(handler http.HandlerFunc, timeout time.Duration) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		ctx, cancel := context.WithTimeout(ctx, timeout)
		defer cancel()

		done := make(chan bool, 1)
		go func() {
			handler(w, r.WithContext(ctx))
			done <- true
		}()

		select {
		case <-ctx.Done():
			http.Error(w, "Request timeout", http.StatusRequestTimeout)
		case <-done:
		}
	}
}

func WithRecover(handler http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if err := recover(); err != nil {
				log.Printf("Panic: %v", err)
				http.Error(w, "Internal server error", http.StatusInternalServerError)
			}
		}()
		handler(w, r)
	}
}

func WithLogging(handler http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		handler(w, r)
		log.Printf("%s %s %v", r.Method, r.URL.Path, time.Since(start))
	}
}

// Helper function to extract path parameters
func extractPathParams(pattern, path string) map[string]string {
	params := make(map[string]string)

	// Convert pattern to regex and extract parameter names
	paramNames := regexp.MustCompile(`\{([^}]+)\}`).FindAllStringSubmatch(pattern, -1)

	// Convert pattern to regex for matching
	regexPattern := regexp.MustCompile(`\{[^}]+\}`).ReplaceAllString(pattern, `([^/]+)`)
	regex := regexp.MustCompile("^" + regexPattern + "$")

	matches := regex.FindStringSubmatch(path)
	if len(matches) > 1 {
		for i, paramName := range paramNames {
			if i+1 < len(matches) {
				params[paramName[1]] = matches[i+1]
			}
		}
	}

	return params
}
