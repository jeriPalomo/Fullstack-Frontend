package com.citibank.customerapi.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/*
 * Reads the Authorization header on every request and, if it carries a valid
 * JWT, populates SecurityContextHolder so the rest of the chain sees an
 * authenticated principal (customerId) with ROLE_CUSTOMER/ROLE_ADMIN authorities.
 *
 * Deliberately NOT a @Component: this filter is registered explicitly via
 * SecurityConfig's addFilterBefore. Annotating it with @Component would make
 * Spring Boot ALSO auto-register it as a generic servlet filter, running it
 * twice per request.
 */
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    public JwtAuthenticationFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (header != null && header.startsWith("Bearer ")) {
            try {
                Claims claims = jwtService.parseClaims(header.substring(7));
                String customerId = claims.getSubject();
                boolean admin = Boolean.TRUE.equals(claims.get("admin", Boolean.class));
                List<GrantedAuthority> authorities = admin
                        ? List.of(new SimpleGrantedAuthority("ROLE_ADMIN"), new SimpleGrantedAuthority("ROLE_CUSTOMER"))
                        : List.of(new SimpleGrantedAuthority("ROLE_CUSTOMER"));

                var authToken = new UsernamePasswordAuthenticationToken(customerId, null, authorities);
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);
            } catch (JwtException | IllegalArgumentException ex) {
                // Invalid/expired token: leave the request unauthenticated rather than
                // rejecting it here - authorizeHttpRequests + the entry point produce the 401.
                SecurityContextHolder.clearContext();
            }
        }
        chain.doFilter(request, response);
    }
}
