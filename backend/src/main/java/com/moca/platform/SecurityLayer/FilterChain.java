package com.moca.platform.SecurityLayer;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;

@Configuration
@EnableWebSecurity
public class FilterChain {

    @Bean
    @ConditionalOnProperty(name = "security.dev-bypass-auth", havingValue = "false", matchIfMissing = true)
    public SecurityFilterChain securedApiChain(HttpSecurity http, JwtService jwt) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(new AntPathRequestMatcher("/api/auth/**")).permitAll()
                .requestMatchers(new AntPathRequestMatcher("/api/health")).permitAll()
                .requestMatchers(new AntPathRequestMatcher("/api/admin/**")).hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .addFilterBefore(new JwtAuthFilter(jwt), UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    /** Dev profile only — see application-dev.yml */
    @Bean
    @ConditionalOnProperty(name = "security.dev-bypass-auth", havingValue = "true")
    public SecurityFilterChain devOpenApiChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth.anyRequest().permitAll());
        return http.build();
    }
}
