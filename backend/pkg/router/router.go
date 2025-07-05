package router

import (
	"net/http"
	"regexp"

	"github.com/hezronokwach/soshi/pkg/middleware"
)

// Router struct to handle routing logic
type Router struct {
	routes []Route
}

// Route represents a single route
type Route struct {
	Method     string
	Pattern    string
	Regex      *regexp.Regexp
	ParamNames []string
	Handler    http.HandlerFunc
}

// NewRouter creates a new router
func NewRouter() *Router {
	return &Router{
		routes: make([]Route, 0),
	}
}

// AddRoute adds a route to the router
func (r *Router) AddRoute(method, pattern string, handler http.HandlerFunc) {
	// Extract parameter names from pattern
	paramRegex := regexp.MustCompile(`\{([^}]+)\}`)
	paramMatches := paramRegex.FindAllStringSubmatch(pattern, -1)

	var paramNames []string
	for _, match := range paramMatches {
		paramNames = append(paramNames, match[1])
	}

	// Convert pattern to regex
	regexPattern := paramRegex.ReplaceAllString(pattern, `([^/]+)`)
	regex := regexp.MustCompile("^" + regexPattern + "$")

	r.routes = append(r.routes, Route{
		Method:     method,
		Pattern:    pattern,
		Regex:      regex,
		ParamNames: paramNames,
		Handler:    handler,
	})
}

// ServeHTTP implements http.Handler
func (r *Router) ServeHTTP(w http.ResponseWriter, req *http.Request) {
	// Add CORS headers
	w.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Accept, Authorization, Content-Type, X-CSRF-Token, Cookie")
	w.Header().Set("Access-Control-Expose-Headers", "Link, Set-Cookie")
	w.Header().Set("Access-Control-Allow-Credentials", "true")
	w.Header().Set("Access-Control-Max-Age", "86400")

	// Handle preflight requests
	if req.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	// Find matching route
	for _, route := range r.routes {
		if route.Method == req.Method && route.Regex.MatchString(req.URL.Path) {
			// Extract parameters
			matches := route.Regex.FindStringSubmatch(req.URL.Path)
			params := make(middleware.URLParams)

			// Map parameter names to values
			for i, paramName := range route.ParamNames {
				if i+1 < len(matches) {
					params[paramName] = matches[i+1]
				}
			}

			// Add parameters to request context
			req = middleware.WithURLParams(req, params)

			// Call handler
			route.Handler(w, req)
			return
		}
	}

	// No route found
	http.NotFound(w, req)
}

// Helper function to apply authentication middleware
func WithAuth(handler http.HandlerFunc, authMiddleware func(http.Handler) http.Handler) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		authMiddleware(handler).ServeHTTP(w, r)
	}
}
