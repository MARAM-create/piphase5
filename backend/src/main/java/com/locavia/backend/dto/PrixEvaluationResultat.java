package com.locavia.backend.dto;


import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@Builder
public class PrixEvaluationResultat {

    private String evaluation;
    private double prixJuste;
    private double prixMin;
    private double prixMax;
    private double ecartPourcentage;

    // Constructeur
    public PrixEvaluationResultat(String evaluation, double prixJuste,
                                  double prixMin, double prixMax,
                                  double ecartPourcentage) {
        this.evaluation = evaluation;
        this.prixJuste = prixJuste;
        this.prixMin = prixMin;
        this.prixMax = prixMax;
        this.ecartPourcentage = ecartPourcentage;
    }

    // Getters
    public String getEvaluation() { return evaluation; }
    public double getPrixJuste() { return prixJuste; }
    public double getPrixMin() { return prixMin; }
    public double getPrixMax() { return prixMax; }
    public double getEcartPourcentage() { return ecartPourcentage; }
}
