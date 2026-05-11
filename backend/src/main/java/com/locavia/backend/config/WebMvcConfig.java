package com.locavia.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Value("${application.upload-dir:uploads/photos}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Use absolute path for file serving
        Path absolutePath = Paths.get(uploadDir).toAbsolutePath().normalize();
        String resourceLocation = "file:" + absolutePath.toString() + "/";

        System.out.println("Photo upload directory: " + absolutePath);
        System.out.println("Resource location: " + resourceLocation);

        registry.addResourceHandler("/photos/**")
                .addResourceLocations(resourceLocation)
                .setCachePeriod(3600);
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/photos/**")
                .allowedOrigins("http://localhost:4200")
                .allowedMethods("GET", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}