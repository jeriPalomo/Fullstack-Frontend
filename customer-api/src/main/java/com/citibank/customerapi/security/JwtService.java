package com.citibank.customerapi.security;

import com.citibank.customerapi.model.Customer;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.time.Instant;
import java.util.Date;

/*
 * Issues and parses the JWTs used to authenticate API requests. The token's
 * subject is the customerId (not the userName) so it can be compared directly
 * against customerId path variables in @PreAuthorize SpEL elsewhere in the app.
 */
@Component
public class JwtService {

    private final SecretKey key;
    private final long expirationMs;

    public JwtService(@Value("${jwt.secret}") String secret, @Value("${jwt.expiration-ms}") long expirationMs) {
        this.key = Keys.hmacShaKeyFor(Decoders.BASE64.decode(secret));
        this.expirationMs = expirationMs;
    }

    public String generateToken(Customer customer) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(customer.getCustomerId())
                .claim("userName", customer.getUserName())
                .claim("admin", customer.isAdmin())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusMillis(expirationMs)))
                .signWith(key, Jwts.SIG.HS256)
                .compact();
    }

    // Throws JwtException (ExpiredJwtException, SignatureException, MalformedJwtException, ...)
    // on any invalid/expired/tampered token - callers decide what that means.
    public Claims parseClaims(String token) {
        return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
    }
}
