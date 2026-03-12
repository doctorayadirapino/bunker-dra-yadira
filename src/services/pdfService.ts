import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface CertificadoData {
    paciente: {
        nombre: string;
        cedula: string;
    };
    empresa: {
        nombre: string;
        rif: string;
    };
    consulta: {
        tipo: string;
        aptitud: string;
        observaciones?: string;
        examen_fisico?: string;
        causa_reposo?: string;
        dias_reposo?: number;
        ciudad?: string;
    };
    doctora: {
        nombre: string;
        mpps: string;
        ci: string;
        cmm: string;
        especialidad: string;
    };
    conFirmaDigital: boolean;
}

interface FisiatriaConsultaData {
    paciente: {
        nombre: string;
        cedula: string;
        edad: string;
        telefono?: string;
    };
    consulta: {
        fecha: string;
        referido_por: string;
        motivo_consulta: string;
        examen_fisico: string;
        diagnostico: string;
        plan_sugerencia: string;
        referencia?: string;
        reposo_constancia?: string;
    };
    recipes: { medicamento: string; indicaciones: string }[];
    conFirmaDigital: boolean;
}

// Función auxiliar para cargar imagen como Promesa
const loadImage = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous'; // Añadido para evitar problemas de CORS
        img.onload = () => resolve(img);
        img.onerror = (e) => reject(e);
        img.src = url;
    });
};

export const generarCertificadoPDF = async (data: CertificadoData) => {
    console.log('Generando Certificado PDF Oficial...');
    try {
        const doc = new jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: [215.9, 279.4] // Carta Estricta 8.5 x 11 in
        });

        const textColor = '#1e293b';

        // --- ENCABEZADO OFICIAL B&W v9.4 [DOMINIO LEGÍTIMO] ---
        console.log('%c--- [AUDITORÍA v9.4: CERTIFICADO B&W OFICIAL] ---', 'color: #000000; font-weight: bold;');
        doc.setTextColor('#000000'); // Negro Puro
        doc.setFont('times', 'bold');
        doc.setFontSize(22);
        doc.text(`Dra. ${data.doctora.nombre} R.`, 105, 15, { align: 'center' });

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('Fisiatra / Medico Ocupacional', 105, 21, { align: 'center' });

        doc.setTextColor('#000000');
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        const subtituloHeader = 'LOPCYMAT DIPLOMADO EN SALUD OCUPACIONAL DIPLOMADO DE ERGONOMIA';
        doc.text(subtituloHeader, 105, 26, { align: 'center' });
        doc.text(`C.I.: V-6.871.964 | M.P.PS: 41.171 | C.M.M: 13.012`, 105, 30, { align: 'center' });
        doc.text(`RIF: V-6871964-6 | INPSASEL: MIR116871964`, 105, 34, { align: 'center' });

        doc.setDrawColor('#000000');
        doc.setLineWidth(0.5);
        doc.line(15, 40, 195, 40);

        doc.setTextColor('#000000');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('CERTIFICADO DE APTITUD MÉDICA', 105, 49, { align: 'center' });

        doc.setTextColor(textColor);
        doc.setFontSize(11);
        const fecha = new Date().toLocaleDateString('es-VE', { day: 'numeric', month: 'long', year: 'numeric' });
        const ciudadActual = data.consulta.ciudad || 'Guarenas';
        doc.text(`En la ciudad de ${ciudadActual}, a los ${fecha}.`, 15, 61);

        doc.setFont('helvetica', 'bold');
        doc.text('HACE CONSTAR:', 15, 70);

        doc.setFont('helvetica', 'normal');
        const parrafo = `Que el ciudadano(a) ${data.paciente.nombre}, titular de la Cédula de Identidad N° ${data.paciente.cedula}, trabajador de la empresa ${data.empresa.nombre} (RIF: ${data.empresa.rif}), ha sido sometido a una evaluación médica ocupacional de tipo ${data.consulta.tipo.toLowerCase()}.`;

        const splitText = doc.splitTextToSize(parrafo, 180);
        doc.text(splitText, 15, 79);

        doc.setDrawColor('#000000');
        doc.rect(15, 103, 186, 22); // Compacted
        doc.setFont('helvetica', 'bold');
        doc.text('CONCLUSIÓN DE APTITUD:', 20, 109);
        doc.setFontSize(16);
        doc.setTextColor(data.consulta.aptitud === 'APTO' ? '#10b981' : '#f59e0b');
        doc.text(data.consulta.aptitud, 108, 117, { align: 'center' });

        let nextY = 155;
        if (data.consulta.dias_reposo && data.consulta.dias_reposo > 0) {
            doc.setTextColor('#ef4444');
            doc.setFontSize(11);
            doc.text(`REPOSO MÉDICO: ${data.consulta.dias_reposo} DÍAS`, 15, nextY);
            nextY += 7;
        }

        if (data.consulta.observaciones) {
            doc.setTextColor(textColor);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text('OBSERVACIONES:', 15, nextY);
            doc.setFont('helvetica', 'normal');
            const obs = doc.splitTextToSize(data.consulta.observaciones, 180);
            doc.text(obs, 15, nextY + 6);
            // v4.0: Actualización dinámica del puntero Y
            nextY += (obs.length * 6) + 12;
        }

        // v8.9: Ajustes Geométricos Híbridos (Firma + Texto Garantizado)
        let dynamicLineY = Math.max(nextY + 35, 235);
        if (dynamicLineY > 255) {
            doc.addPage();
            dynamicLineY = 40;
        }

        if (data.conFirmaDigital) {
            try {
                const img = await loadImage('/firma_doctora.png');
                doc.addImage(img, 'PNG', 80, dynamicLineY - 28, 50, 30); // Ajuste fino final
            } catch (e) {
                console.error('Error firma:', e);
            }
        }

        // Siempre dibujar Línea y Credenciales debajo (Estética Universal Fisiatría/Laboral)
        doc.setDrawColor('#000000');
        doc.line(78, dynamicLineY, 138, dynamicLineY);

        doc.setFontSize(10);
        doc.setTextColor(textColor);
        doc.setFont('helvetica', 'bold');
        doc.text(`Dra. YADIRA PINO R.`, 108, dynamicLineY + 6, { align: 'center' });
        doc.setFontSize(8);
        doc.text('Fisiatra / Medico Ocupacional', 108, dynamicLineY + 11, { align: 'center' });

        doc.setTextColor('#64748b');
        doc.setFontSize(7);
        doc.text('DESARROLLADOR LIC CARLOS FUENTES 04129581040', 15, 275);

        doc.save(`Certificado_${data.paciente.cedula}_v9.4.pdf`);
    } catch (err) {
        console.error('Error PDF Certificado:', err);
    }
};

export const generarConsultaFisiatriaPDF = async (data: FisiatriaConsultaData) => {
    try {
        const doc = new jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: [215.9, 355.6] // Oficio Estricta 8.5 x 14 in
        });

        const textColor = '#1e293b';

        // Función Helper para inyectar Cabecera Compacta (Márgenes Mínimos v9.8)
        const renderHeader = () => {
            console.log('AUDITORIA v10.0-GOLD: Aplicando RenderHeader Estático...');
            doc.setTextColor('#000000');
            doc.setFont('times', 'bold');
            doc.setFontSize(20);
            doc.text(`Dra. YADIRA PINO R.`, 105, 12, { align: 'center' });

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.text('FISIATRA', 105, 17, { align: 'center' });

            doc.setTextColor('#000000');
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.text(`C.I.: V-6.871.964 | M.P.PS: 41.171 | C.M.M: 13.012`, 105, 22, { align: 'center' });

            doc.setDrawColor('#000000');
            doc.setLineWidth(0.4);
            doc.line(10, 26, 205, 26);
        };

        // Función v9.8: Formateo literal para evitar el "Salto de Fecha UTC"
        const formatFechaEstatica = (fechaISO: string) => {
            if (!fechaISO) return 'N/A';
            // Si viene como YYYY-MM-DD
            const partes = fechaISO.split('T')[0].split('-');
            if (partes.length === 3) {
                return `${partes[2]}/${partes[1]}/${partes[0]}`;
            }
            return fechaISO;
        };

        renderHeader();

        // --- TÍTULO COMPACTO ---
        doc.setTextColor('#000000');
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('INFORME DE CONSULTA FISIÁTRICA', 105, 38, { align: 'center' });

        // --- DATOS DEL PACIENTE (Margen 10mm) ---
        doc.setFillColor('#f8fafc');
        doc.rect(10, 45, 195, 22, 'F');
        doc.setDrawColor('#e2e8f0');
        doc.rect(10, 45, 195, 22, 'S');
        doc.setTextColor(textColor);
        doc.setFontSize(9);
        doc.text(`PACIENTE: ${data.paciente.nombre}`, 15, 51);
        doc.text(`CÉDULA: ${data.paciente.cedula}`, 15, 56);
        doc.text(`EDAD: ${data.paciente.edad} AÑOS`, 110, 51);
        doc.text(`FECHA: ${formatFechaEstatica(data.consulta.fecha)}`, 110, 56);
        doc.text(`TELÉFONO: ${data.paciente.telefono || 'N/A'}`, 15, 61);

        // --- CUERPO DEL INFORME ---
        let currentY = 75; // 90 -> 75

        const drawSection = (title: string, content: string) => {
            if (!content) return;
            if (currentY > 320) { doc.addPage(); renderHeader(); currentY = 40; }
            doc.setTextColor(textColor);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9);
            doc.text(title.toUpperCase(), 10, currentY);
            doc.setTextColor(textColor);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            const splitContent = doc.splitTextToSize(content, 190); // Más ancho
            doc.text(splitContent, 10, currentY + 5);
            currentY += (splitContent.length * 5) + 8;
        };

        drawSection('Referido por:', data.consulta.referido_por);
        drawSection('Motivo de Consulta:', data.consulta.motivo_consulta);
        drawSection('Examen Físico / Evaluación:', data.consulta.examen_fisico);
        drawSection('Impresión Diagnóstica:', data.consulta.diagnostico);
        drawSection('Plan Terapéutico / Sugerencias:', data.consulta.plan_sugerencia);

        if (data.consulta.reposo_constancia) {
            drawSection('Reposo / Constancia:', data.consulta.reposo_constancia);
        }

        if (data.consulta.referencia) {
            drawSection('Referencia:', data.consulta.referencia);
        }

        const refDra = (data.consulta as any).referencia_medico;
        const refEsp = (data.consulta as any).referencia_especialidad;
        const refMotivo = (data.consulta as any).referencia_motivo;

        if (refDra || refEsp || refMotivo) {
            let textoReferencia = '';
            if (refDra) textoReferencia += `A: DR(A). ${refDra}\n`;
            if (refEsp) textoReferencia += `ESPECIALIDAD: ${refEsp}\n`;
            if (refMotivo) textoReferencia += `MOTIVO: ${refMotivo}`;
            drawSection('Referencia Médica a Especialista:', textoReferencia.trim());
        }

        const radDetalle = (data.consulta as any).radiodiagnostico_detalle;
        if (radDetalle) {
            drawSection('Orden de Estudios Médicos / Radiodiagnóstico:', radDetalle);
        }

        // --- RÉCIPE SI EXISTE ---
        if (data.recipes.length > 0) {
            if (currentY > 300) { doc.addPage(); renderHeader(); currentY = 45; }
            doc.setFontSize(11);
            doc.setTextColor(textColor);
            doc.setFont('helvetica', 'bold');
            doc.text('CONDUCTA FARMACOLÓGICA / INDICACIONES:', 15, currentY);
            currentY += 8;

            data.recipes.forEach(r => {
                doc.setFont('helvetica', 'bold');
                doc.text(`• ${r.medicamento}:`, 20, currentY);
                doc.setFont('helvetica', 'normal');
                const ind = doc.splitTextToSize(r.indicaciones, 160);
                doc.text(ind, 30, currentY + 5);
                currentY += (ind.length * 5) + 10;
                if (currentY > 320) { doc.addPage(); renderHeader(); currentY = 45; }
            });
        }

        // --- FIRMA CENTRADA (MÁXIMA EFICIENCIA v9.6) ---
        let footerY = currentY + 25;
        if (footerY > 330) { doc.addPage(); renderHeader(); footerY = 50; }

        if (data.conFirmaDigital) {
            try {
                const img = await loadImage('/firma_doctora.png');
                doc.addImage(img, 'PNG', 85.5, footerY - 28, 45, 30);
            } catch (e) { console.error('Error firma:', e); }
        }

        doc.setDrawColor('#000000');
        doc.line(78, footerY, 138, footerY);

        doc.setFontSize(11);
        doc.setTextColor('#000000');
        doc.setFont('helvetica', 'bold');
        doc.text(`Dra. YADIRA PINO R.`, 108, footerY + 6, { align: 'center' });
        doc.setFontSize(9);
        doc.text('FISIATRA', 108, footerY + 11, { align: 'center' });

        doc.setTextColor('#94a3b8');
        doc.setFontSize(6);
        doc.text('DESARROLLADOR LIC CARLOS FUENTES 04129581040', 10, 350);

        doc.save(`Consulta_${data.paciente.cedula}_v10.0.pdf`);
    } catch (error) {
        console.error('Error Fisiatria PDF:', error);
    }
};

export const generarRecipeFisiatriaPDF = async (data: FisiatriaConsultaData) => {
    try {
        const doc = new jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: [215.9, 279.4] // Carta Estricta 8.5 x 11 in
        });

        const textColor = '#1e293b'; // Definido para B&W compliance

        // Función Helper para inyectar Cabecera de Fisiatría (B&W + NEGRITA - Protocolo v11.0)
        const renderHeader = () => {
            doc.setTextColor('#000000'); // Negro Puro
            doc.setFont('times', 'bold');
            doc.setFontSize(22);
            doc.text(`Dra. YADIRA PINO R.`, 105, 12, { align: 'center' });

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.text('FISIATRA', 105, 17, { align: 'center' });

            doc.setTextColor('#000000');
            doc.setFontSize(7.5); // Ligeramente más pequeño para espacio
            doc.setFont('helvetica', 'bold');
            doc.text(`C.I.: V-6.871.964 | M.P.PS: 41.171 | C.M.M: 13.012 | INPSASEL: MIR116871964`, 105, 21, { align: 'center' });
            
            // v11.0: Dirección en una sola línea
            doc.setFontSize(7);
            doc.text('Direccion: calle acueducto, con Av estadio, casa No 3 El Barbecho - los Teques, Edo Miranda / teléfonos: 0414-2415697', 105, 25, { align: 'center' });

            doc.setDrawColor('#000000');
            doc.setLineWidth(0.4);
            doc.line(15, 28, 195, 28);
        };

        renderHeader();

        doc.setTextColor('#1e293b');
        doc.setFontSize(11);
        doc.text(`Paciente: ${data.paciente.nombre}`, 15, 36);
        doc.text(`C.I.: V-${data.paciente.cedula}`, 15, 42); // Añadida Cédula de Identidad
        doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 160, 36);
        doc.setFontSize(16);
        doc.setTextColor(textColor); // Título en negro (B&W compliance)
        doc.text('RÉCIPE', 105, 52, { align: 'center' }); // Solo RÉCIPE
        doc.line(95, 53, 115, 53);

        let currentY = 62;
        data.recipes.forEach((r, idx) => {
            doc.setTextColor(textColor); // Negro puro
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.text(`${idx + 1}. ${r.medicamento}`, 20, currentY);

            currentY += 15;

            if (currentY > 240) { doc.addPage(); renderHeader(); currentY = 45; }
        });

        // v8.5: Blindaje antisobreposición Récipe (Escala Carta)
        let footerY = Math.max(currentY + 35, 230);
        if (footerY > 250) {
            doc.addPage();
            renderHeader();
            footerY = 55;
        }

        if (data.conFirmaDigital) {
            try {
                const img = await loadImage('/firma_doctora.png');
                doc.addImage(img, 'PNG', 85.5, footerY - 28, 45, 30);
            } catch (e) {
                console.error('Error firma:', e);
            }
        }

        doc.setDrawColor('#000000');
        doc.line(78, footerY, 138, footerY);

        doc.setFontSize(11);
        doc.setTextColor('#000000');
        doc.setFont('helvetica', 'bold');
        doc.text(`Dra. YADIRA PINO R.`, 108, footerY + 6, { align: 'center' });
        doc.setFontSize(9);
        doc.text('FISIATRA', 108, footerY + 11, { align: 'center' });

        // --- SEGUNDA PÁGINA: INDICACIONES MÉDICAS ---
        doc.addPage();
        renderHeader();

        doc.setTextColor('#1e293b');
        doc.setFontSize(11);
        doc.text(`Paciente: ${data.paciente.nombre}`, 15, 36);
        doc.text(`C.I.: V-${data.paciente.cedula}`, 15, 42);
        doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 160, 36);

        doc.setFontSize(16);
        doc.setTextColor(textColor);
        doc.text('INDICACIONES', 105, 52, { align: 'center' });
        doc.line(85, 53, 125, 53);

        let indY = 62;
        data.recipes.forEach((r, idx) => {
            doc.setTextColor(textColor);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            doc.text(`${idx + 1}. ${r.medicamento}:`, 20, indY);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            const indicationsText = doc.splitTextToSize(r.indicaciones, 160);
            doc.text(indicationsText, 25, indY + 6);

            indY += (indicationsText.length * 5) + 8;

            if (indY > 240) { doc.addPage(); renderHeader(); indY = 45; }
        });

        // Firma en Indicaciones
        let indFooterY = Math.max(indY + 35, 230);
        if (indFooterY > 250) {
            doc.addPage();
            renderHeader();
            indFooterY = 55;
        }

        if (data.conFirmaDigital) {
            try {
                const img = await loadImage('/firma_doctora.png');
                doc.addImage(img, 'PNG', 85.5, indFooterY - 28, 45, 30);
            } catch (e) {
                console.error('Error firma:', e);
            }
        }

        doc.setDrawColor('#000000');
        doc.line(78, indFooterY, 138, indFooterY);

        doc.setFontSize(11);
        doc.setTextColor('#000000');
        doc.setFont('helvetica', 'bold');
        doc.text(`Dra. YADIRA PINO R.`, 108, indFooterY + 6, { align: 'center' });
        doc.setFontSize(9);
        doc.text('FISIATRA', 108, indFooterY + 11, { align: 'center' });

        doc.save(`Recipe_Indicaciones_${data.paciente.cedula}.pdf`);
    } catch (error) {
        console.error('Error Recipe PDF:', error);
    }
};

interface SurveillanceData {
    companyName: string;
    month: string;
    stats: {
        totalPatients: number;
        totalConsultations: number;
        absenteeismRate: string;
        topPathologies: { name: string; value: number }[];
        demographics: { group: string; Masc: number; Fem: number }[];
        consultationTypes: { name: string; value: number }[];
    };
    conFirmaDigital?: boolean;
}

export const generarReporteVigilanciaPDF = async (data: SurveillanceData) => {
    console.log('%c--- [AUDITORÍA DE VERSIÓN CARLOS FUENTES: v2.0 - LIMPIO SIN GRÁFICOS] ---', 'color: #0284c7; font-weight: bold; font-size: 14px;');
    console.log('Generando Reporte Vigilancia Oficial...');
    try {
        const doc = new jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: [215.9, 279.4] // Carta Estricta 8.5 x 11 in
        });

        const textColor = '#1e293b';

        // --- ENCABEZADO OFICIAL v9.1 [B&W + NEGRITA] ---
        doc.setTextColor('#000000'); // Negro Puro
        doc.setFont('times', 'bold');
        doc.setFontSize(22);
        doc.text(`Dra. YADIRA PINO R.`, 105, 15, { align: 'center' });

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('Fisiatra / Medico Ocupacional', 105, 21, { align: 'center' });

        doc.setTextColor('#000000');
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        const subtitulo = 'LOPCYMAT DIPLOMADO EN SALUD OCUPACIONAL DIPLOMADO DE ERGONOMIA';
        doc.text(subtitulo, 105, 26, { align: 'center' });
        doc.text(`RIF: V-6871964-6 | INPSASEL: MIR116871964`, 105, 30, { align: 'center' });
        doc.text(`C.I.: V-6.871.964 | M.P.PS: 41.171 | C.M.M: 13.012`, 105, 34, { align: 'center' });

        doc.setDrawColor('#000000');
        doc.setLineWidth(0.5);
        doc.line(15, 40, 195, 40);

        doc.setTextColor('#000000');
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('INFORME EPIDEMIOLÓGICO MENSUAL (LOPCYMAT)', 105, 49, { align: 'center' });

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(textColor);
        doc.text(`EMPRESA: ${data.companyName.toUpperCase()}`, 105, 55, { align: 'center' });
        doc.text(`PERÍODO: ${data.month}`, 105, 60, { align: 'center' });

        doc.setFillColor('#f8fafc');
        doc.rect(15, 66, 60, 18, 'F');
        doc.rect(78, 66, 60, 18, 'F');
        doc.rect(141, 66, 60, 18, 'F');

        doc.setTextColor('#000000');
        doc.setFontSize(16);
        doc.text(`${data.stats.totalPatients}`, 45, 73, { align: 'center' });
        doc.text(`${data.stats.absenteeismRate}%`, 108, 73, { align: 'center' });
        doc.text(`${data.stats.totalConsultations}`, 171, 73, { align: 'center' });

        doc.setFontSize(8);
        doc.text('POBLACIÓN TOTAL', 45, 79, { align: 'center' });
        doc.text('ÍNDICE AUSENTISMO', 108, 79, { align: 'center' });
        doc.text('CONSULTAS TOTALES', 171, 79, { align: 'center' });

        autoTable(doc, {
            startY: 88,
            head: [['Morbilidad por Sistema', 'Casos', '%']],
            body: data.stats.topPathologies.map(p => [
                p.name,
                p.value,
                `${((p.value / (data.stats.totalConsultations || 1)) * 100).toFixed(1)}%`
            ]),
            theme: 'striped',
            headStyles: { fillColor: [0, 0, 0] },
            margin: { bottom: 5 }
        });

        const lastY = (doc as any).lastAutoTable.finalY + 8;
        autoTable(doc, {
            startY: lastY,
            head: [['Grupo Etario', 'M', 'F', 'T']],
            body: data.stats.demographics.map(d => [d.group, d.Masc, d.Fem, d.Masc + d.Fem]),
            theme: 'striped',
            headStyles: { fillColor: [0, 0, 0] },
            margin: { bottom: 5 }
        });

        // v9.1: Ajustes Geométricos B&W Cero Redundancia
        let drawY = Math.max((doc as any).lastAutoTable.finalY + 35, 235);
        if (drawY > 255) { doc.addPage(); drawY = 40; }

        if (data.conFirmaDigital) {
            try {
                const img = await loadImage('/firma_doctora.png');
                doc.addImage(img, 'PNG', 83, drawY - 28, 50, 30);
            } catch (e) { console.error('Error firma:', e); }
        }

        doc.setDrawColor('#000000');
        doc.line(78, drawY, 138, drawY);

        doc.setFontSize(10);
        doc.setTextColor('#000000');
        doc.setFont('helvetica', 'bold');
        doc.text(`Dra. YADIRA PINO R.`, 108, drawY + 6, { align: 'center' });
        doc.setFontSize(8);
        doc.text('Fisiatra / Medico Ocupacional', 108, drawY + 11, { align: 'center' });

        doc.setTextColor('#64748b');
        doc.setFontSize(7);
        doc.text('DESARROLLADOR LIC CARLOS FUENTES 04129581040', 15, 275);

        doc.save(`Vigilancia_${data.companyName}.pdf`);
    } catch (error) {
        console.error('Crash en Vigilancia PDF:', error);
    }
};

export const generarListadoEmpresaPDF = async (companyName: string, consultas: any[]) => {
    try {
        const doc = new jsPDF({
            orientation: 'l',
            unit: 'mm',
            format: [215.9, 279.4] // Carta Estricta 8.5 x 11 in
        });

        // --- ENCABEZADO Landscape v9.1 [B&W] ---
        doc.setTextColor('#000000');
        doc.setFont('times', 'bold');
        doc.setFontSize(22);
        doc.text(`Dra. YADIRA PINO R.`, 140, 15, { align: 'center' });

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text('Fisiatra / Medico Ocupacional | C.I. V-6.871.964 | MPPS 41171 | CMM 13012 | RIF V-6871964-6 | INPSASEL MIR116871964', 140, 21, { align: 'center' });
        doc.text('Telfs.: 0414-241.5697 | 0412-701.4041', 140, 25, { align: 'center' });

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.text(`LISTADO DE EVALUACIONES MÉDICAS - ${companyName}`, 140, 32, { align: 'center' });

        const body = consultas.map(c => [
            new Date(c.fecha_consulta).toLocaleDateString(),
            c.pacientes?.nombre_completo || 'N/A',
            c.pacientes?.cedula || 'N/A',
            c.tipo_consulta,
            c.aptitud_medica,
            c.tipo_patologia
        ]);

        autoTable(doc, {
            startY: 38,
            head: [['Fecha', 'Paciente', 'Cédula', 'Tipo', 'Aptitud', 'Diagnóstico']],
            body: body,
            theme: 'striped',
            headStyles: { fillColor: [0, 0, 0] },
            margin: { bottom: 5 }
        });

        doc.setTextColor('#64748b');
        doc.setFontSize(7);
        doc.text('DESARROLLADOR LIC CARLOS FUENTES 04129581040', 15, 205);

        doc.save(`Listado_${companyName}.pdf`);
    } catch (err) {
        console.error('Error Listado PDF:', err);
    }
};

interface ReposoData {
    paciente: {
        nombre: string;
        cedula: string;
        empresa?: string;
    };
    reposo: {
        diagnostico: string;
        dias: number;
        desde: string;
        hasta: string;
        indicaciones?: string;
        ciudad: string;
        tipo: 'REPOSO' | 'CONSTANCIA';
        condicion: 'Paciente' | 'Familiar';
        ameritaReposo: boolean;
    };
    doctora: {
        nombre: string;
        ci: number;
        mpps: number;
        cmm: number;
        especialidad: string;
    };
    conFirmaDigital?: boolean;
}

export const generarReposoPDF = async (data: ReposoData) => {
    const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: [215.9, 279.4] // Carta Estricta 8.5 x 11 in
    });

    // v6.4: Unified Brand Colors (Pink/Blue)
    const textColor = '#1e293b';

    // --- ENCABEZADO Reposo B&W v9.2 ---
    doc.setTextColor('#000000'); // Negro Puro
    doc.setFont('times', 'bold');
    doc.setFontSize(22);
    doc.text(`Dra. ${data.doctora.nombre} R.`, 105, 15, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Fisiatra / Medico Ocupacional', 105, 21, { align: 'center' });

    doc.setTextColor('#000000');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    const subtituloReposo = 'LOPCYMAT DIPLOMADO EN SALUD OCUPACIONAL DIPLOMADO DE ERGONOMIA';
    doc.text(subtituloReposo, 105, 26, { align: 'center' });
    doc.text(`C.I.: V-6.871.964 | M.P.PS: 41.171 | C.M.M: 13.012`, 105, 30, { align: 'center' });
    doc.text(`RIF: V-6871964-6 | INPSASEL: MIR116871964`, 105, 34, { align: 'center' });

    doc.setDrawColor('#000000');
    doc.setLineWidth(0.5);
    doc.line(15, 40, 195, 40);

    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    if (data.reposo.tipo === 'REPOSO') {
        doc.setTextColor('#000000');
        doc.text('CONSTANCIA DE REPOSO', 105, 52, { align: 'center' });
    } else {
        doc.setTextColor('#000000');
        doc.text('CONSTANCIA DE ASISTENCIA', 105, 52, { align: 'center' });
    }

    doc.setTextColor(textColor);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);

    let currentY = 68;
    doc.text('Sr(a). o Paciente:', 15, currentY);
    doc.line(48, currentY + 1, 140, currentY + 1);
    doc.setFont('helvetica', 'bold');
    doc.text(data.paciente.nombre, 50, currentY);

    doc.setFont('helvetica', 'normal');
    doc.text('C.I.:', 145, currentY);
    doc.line(155, currentY + 1, 195, currentY + 1);
    doc.setFont('helvetica', 'bold');
    doc.text(data.paciente.cedula, 157, currentY);

    currentY += 15;
    const fechaActual = new Date();
    doc.setFont('helvetica', 'normal');
    doc.text('asistió a la consulta el día:', 15, currentY);
    doc.line(65, currentY + 1, 110, currentY + 1);
    doc.setFont('helvetica', 'bold');
    doc.text(fechaActual.toLocaleDateString(), 68, currentY);

    doc.setFont('helvetica', 'normal');
    doc.text('en condición de:', 115, currentY);
    doc.rect(148, currentY - 4, 4, 4); doc.text('Paciente', 155, currentY);
    doc.rect(178, currentY - 4, 4, 4); doc.text('Familiar', 185, currentY);

    doc.setFont('helvetica', 'bold');
    if (data.reposo.condicion === 'Paciente') doc.text('X', 149, currentY - 0.5);
    else doc.text('X', 179, currentY - 0.5);

    currentY += 15;
    doc.text('ameritó reposo médico:', 15, currentY);
    doc.rect(65, currentY - 4, 4, 4); doc.text('Si', 72, currentY);
    doc.rect(85, currentY - 4, 4, 4); doc.text('No', 92, currentY);

    if (data.reposo.ameritaReposo) {
        doc.setFont('helvetica', 'bold');
        doc.text('X', 66, currentY - 0.5);
        doc.setFont('helvetica', 'normal');
        doc.text('Días:', 105, currentY);
        doc.line(118, currentY + 1, 130, currentY + 1);
        doc.setFont('helvetica', 'bold');
        doc.text(data.reposo.dias.toString(), 120, currentY);
        doc.setFont('helvetica', 'normal');
        doc.text('Desde:', 135, currentY);
        doc.line(150, currentY + 1, 168, currentY + 1);
        doc.setFont('helvetica', 'bold');
        doc.text(new Date(data.reposo.desde + 'T12:00:00').toLocaleDateString(), 151, currentY);
        doc.setFont('helvetica', 'normal');
        doc.text('Hasta:', 170, currentY);
        doc.line(184, currentY + 1, 202, currentY + 1);
        doc.setFont('helvetica', 'bold');
        doc.text(new Date(data.reposo.hasta + 'T12:00:00').toLocaleDateString(), 185, currentY);
    } else {
        doc.setFont('helvetica', 'bold');
        doc.text('X', 86, currentY - 0.5);
    }

    currentY += 15;
    doc.text('IDX:', 15, currentY);
    doc.line(25, currentY + 1, 195, currentY + 1);
    doc.setFont('helvetica', 'bold');
    doc.text(data.reposo.diagnostico, 28, currentY);

    currentY += 15;
    doc.setFont('helvetica', 'normal');
    doc.text('Constancia que se expide a petición de la parte interesada', 15, currentY);

    currentY += 10;
    const mes = fechaActual.toLocaleString('es-VE', { month: 'long' });
    doc.text(`en: ${data.reposo.ciudad}, el ${fechaActual.getDate()} de ${mes} de ${fechaActual.getFullYear()}.`, 15, currentY);

    // v8.5: Blindaje Máximo Reposo [ESCALA CARTA 100%]
    let footerY = Math.max(currentY + 20, 235);
    if (footerY > 255) {
        doc.addPage();
        footerY = 35;
    }

    // Bloque de contacto removido por solicitud v5.0

    // Bloque de Firma Final (Centrado v8.6)
    if (data.conFirmaDigital) {
        try {
            const img = await loadImage('/firma_doctora.png');
            doc.addImage(img, 'PNG', 83, footerY - 33, 50, 35); // X=83 (Centro de 216 - 50/2)
        } catch (e) {
            console.error('Error firma reposo:', e);
        }
    }

    doc.setDrawColor('#000000');
    doc.line(78, footerY + 2, 138, footerY + 2); // Línea de 60mm centrada (108 +/- 30)

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor('#000000');
    doc.text(`Dra. ${data.doctora.nombre} R.`, 108, footerY + 8, { align: 'center' }); // X=108 Centro
    doc.setFontSize(8);
    doc.setTextColor(textColor);
    doc.text('Fisiatra / Medico Ocupacional', 108, footerY + 12, { align: 'center' });

    doc.setTextColor('#64748b');
    doc.setFontSize(7);
    doc.text('DESARROLLADOR LIC CARLOS FUENTES 04129581040', 15, 275);

    doc.save(`Reposo_${data.paciente.cedula}.pdf`);
};

export const generarReferenciaFisiatriaPDF = async (data: FisiatriaConsultaData) => {
    try {
        const doc = new jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: [215.9, 355.6]
        });

        const textColor = '#1e293b';

        const renderHeader = () => {
            doc.setTextColor('#000000'); // Negro Puro
            doc.setFont('times', 'bold');
            doc.setFontSize(22);
            doc.text(`Dra. YADIRA PINO R.`, 105, 15, { align: 'center' });

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.text('FISIATRA', 105, 21, { align: 'center' });

            doc.setTextColor('#000000');
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.text(`C.I.: V-6.871.964 | M.P.PS: 41.171 | C.M.M: 13.012`, 105, 26, { align: 'center' });

            doc.setDrawColor('#000000');
            doc.setLineWidth(0.5);
            doc.line(15, 34, 195, 34);
        };

        renderHeader();

        doc.setTextColor('#1e293b');
        doc.setFontSize(11);
        doc.text(`Paciente: ${data.paciente.nombre}`, 15, 41);
        doc.text(`C.I.: V-${data.paciente.cedula}`, 15, 47);
        doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 160, 41);

        doc.setFontSize(16);
        doc.setTextColor(textColor);
        doc.text('HOJA DE REFERENCIA', 105, 58, { align: 'center' });
        doc.line(80, 59, 130, 59);

        let currentY = 75;

        const medico = (data.consulta as any).referencia_medico || '';
        const especialidad = (data.consulta as any).referencia_especialidad || '';
        const motivo = (data.consulta as any).referencia_motivo || '';

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('A: Dr(a).', 20, currentY);
        doc.setFont('helvetica', 'normal');
        doc.text(medico, 40, currentY);

        currentY += 10;
        doc.setFont('helvetica', 'bold');
        doc.text('Especialidad:', 20, currentY);
        doc.setFont('helvetica', 'normal');
        doc.text(especialidad, 48, currentY);

        currentY += 15;
        doc.setFont('helvetica', 'bold');
        doc.text('Breve resumen / Motivo de referencia:', 20, currentY);
        currentY += 8;
        doc.setFont('helvetica', 'normal');
        const motivoLine = doc.splitTextToSize(motivo, 170);
        doc.text(motivoLine, 20, currentY);

        let footerY = Math.max(currentY + (motivoLine.length * 6) + 35, 305);
        if (footerY > 325) {
            doc.addPage();
            renderHeader();
            footerY = 60;
        }

        if (data.conFirmaDigital) {
            try {
                const img = await loadImage('/firma_doctora.png');
                doc.addImage(img, 'PNG', 85.5, footerY - 28, 45, 30);
            } catch (e) { console.error('Error firma:', e); }
        }

        doc.setDrawColor('#000000');
        doc.line(78, footerY, 138, footerY);

        doc.setFontSize(11);
        doc.setTextColor('#000000');
        doc.setFont('helvetica', 'bold');
        doc.text(`Dra. YADIRA PINO R.`, 108, footerY + 6, { align: 'center' });
        doc.setFontSize(9);
        doc.text('FISIATRA', 108, footerY + 11, { align: 'center' });

        doc.save(`Referencia_${data.paciente.cedula}.pdf`);
    } catch (e) {
        console.error('Error Referencia PDF:', e);
    }
};

export const generarRadiodiagnosticoFisiatriaPDF = async (data: FisiatriaConsultaData) => {
    try {
        const doc = new jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: [215.9, 355.6]
        });

        const textColor = '#1e293b';

        const renderHeader = () => {
            doc.setTextColor('#000000'); // Negro Puro
            doc.setFont('times', 'bold');
            doc.setFontSize(22);
            doc.text(`Dra. YADIRA PINO R.`, 105, 15, { align: 'center' });

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.text('FISIATRA', 105, 21, { align: 'center' });

            doc.setTextColor('#000000');
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.text(`C.I.: V-6.871.964 | M.P.PS: 41.171 | C.M.M: 13.012`, 105, 26, { align: 'center' });

            doc.setDrawColor('#000000');
            doc.setLineWidth(0.5);
            doc.line(15, 34, 195, 34);
        };

        renderHeader();

        doc.setTextColor('#1e293b');
        doc.setFontSize(11);
        doc.text(`Paciente: ${data.paciente.nombre}`, 15, 41);
        doc.text(`C.I.: V-${data.paciente.cedula}`, 15, 47);
        doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 160, 41);

        doc.setFontSize(16);
        doc.setTextColor(textColor);
        doc.text('ORDEN DE RADIODIAGNÓSTICO', 105, 58, { align: 'center' });
        doc.line(70, 59, 140, 59);

        let currentY = 75;

        const detalle = (data.consulta as any).radiodiagnostico_detalle || '';

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Se solicita:', 20, currentY);
        currentY += 8;

        doc.setFont('helvetica', 'normal');
        const detalleLine = doc.splitTextToSize(detalle, 170);
        doc.text(detalleLine, 20, currentY);

        let footerY = Math.max(currentY + (detalleLine.length * 6) + 35, 305);
        if (footerY > 325) {
            doc.addPage();
            renderHeader();
            footerY = 60;
        }

        if (data.conFirmaDigital) {
            try {
                const img = await loadImage('/firma_doctora.png');
                doc.addImage(img, 'PNG', 85.5, footerY - 28, 45, 30);
            } catch (e) { console.error('Error firma:', e); }
        }

        doc.setDrawColor('#000000');
        doc.line(78, footerY, 138, footerY);

        doc.setFontSize(11);
        doc.setTextColor('#000000');
        doc.setFont('helvetica', 'bold');
        doc.text(`Dra. YADIRA PINO R.`, 108, footerY + 6, { align: 'center' });
        doc.setFontSize(9);
        doc.text('FISIATRA', 108, footerY + 11, { align: 'center' });

        doc.save(`Radiodiagnostico_${data.paciente.cedula}.pdf`);
    } catch (e) {
        console.error('Error Radiodiagnostico PDF:', e);
    }
};
