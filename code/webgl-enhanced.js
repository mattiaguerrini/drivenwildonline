// Miglioramenti WebGL per qualità grafica superiore
// Questo file ottimizza le impostazioni WebGL per prestazioni migliori

(function() {
    'use strict';
    
    // Attendi che glContext sia disponibile
    const originalGlInit = window.glInit;
    
    window.glInit = function() {
        // Chiama la funzione originale
        originalGlInit.call(this);
        
        // Applica miglioramenti se glContext esiste
        if (typeof glContext !== 'undefined' && glContext) {
            console.log('Applicando miglioramenti WebGL...');
            
            // Abilita antialiasing
            glContext.enable(glContext.SAMPLE_COVERAGE);
            glContext.sampleCoverage(1.0, false);
            
            // Migliora la qualità del depth test
            glContext.enable(glContext.DEPTH_TEST);
            glContext.depthFunc(glContext.LEQUAL);
            
            // Abilita face culling per prestazioni migliori
            glContext.enable(glContext.CULL_FACE);
            glContext.cullFace(glContext.BACK);
            
            // Migliora blending
            glContext.enable(glContext.BLEND);
            glContext.blendFunc(glContext.SRC_ALPHA, glContext.ONE_MINUS_SRC_ALPHA);
            
            // Hint per qualità migliore
            glContext.hint(glContext.GENERATE_MIPMAP_HINT, glContext.NICEST);
            
            console.log('Miglioramenti WebGL applicati con successo!');
        }
    };
})();
