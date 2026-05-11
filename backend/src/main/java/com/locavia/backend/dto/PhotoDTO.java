package com.locavia.backend.dto;

import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class PhotoDTO {
    private Long id;
    private String url;
    private String altText;
    private Integer ordre;
    private LocalDateTime dateUpload;
}