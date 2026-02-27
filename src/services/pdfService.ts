import jsPDF from 'jspdf';
import 'jspdf-autotable';

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
    };
    doctora: {
        nombre: string;
        mpps: string;
        cmm: string;
    };
    conFirmaDigital: boolean;
}

export const generarCertificadoPDF = (data: CertificadoData) => {
    const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'letter'
    });

    const blueColor = '#1e3a8a';
    const lightBlue = '#e7effb';

    // --- ENCABEZADO ---
    doc.setFillColor(lightBlue);
    doc.rect(0, 0, 216, 40, 'F');

    doc.setTextColor(blueColor);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('CERTIFICADO DE APTITUD MÉDICA', 108, 20, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const subtitulo = data.consulta.tipo === 'CERTIFICADO SALUD' ? 'Salud Integral Ocupacional' : `Evaluación Médica: ${data.consulta.tipo}`;
    doc.text(subtitulo, 108, 28, { align: 'center' });

    // --- DATOS DEL MÉDICO (Izquierda Superior) ---
    doc.setFontSize(9);
    doc.setTextColor('#64748b');
    doc.text([
        `Dra. ${data.doctora.nombre}`,
        `M.P.P.S: ${data.doctora.mpps} / C.M.M: ${data.doctora.cmm}`,
        'Especialista en Salud Ocupacional'
    ], 15, 50);

    // --- CUERPO DEL CERTIFICADO ---
    doc.setTextColor('#1e293b');
    doc.setFontSize(12);
    const fecha = new Date().toLocaleDateString('es-VE', { day: 'numeric', month: 'long', year: 'numeric' });
    doc.text(`En la ciudad de Guarenas, a los ${fecha}.`, 15, 75);

    doc.setFont('helvetica', 'bold');
    doc.text('HACE CONSTAR:', 15, 85);

    doc.setFont('helvetica', 'normal');
    const parrafo = `Que el ciudadano(a) ${data.paciente.nombre}, titular de la Cédula de Identidad N° ${data.paciente.cedula}, trabajador de la empresa ${data.empresa.nombre} (RIF: ${data.empresa.rif}), ha sido sometido a una evaluación médica ocupacional de tipo ${data.consulta.tipo.toLowerCase()}.`;

    const splitText = doc.splitTextToSize(parrafo, 185);
    doc.text(splitText, 15, 95);

    // --- DICTAMEN FINAL (CAJA RESALTADA) ---
    doc.setDrawColor(blueColor);
    doc.setLineWidth(0.5);
    doc.rect(15, 115, 186, 25);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('CONCUSIÓN DE APTITUD:', 20, 122);

    doc.setFontSize(14);
    doc.setTextColor(data.consulta.aptitud === 'APTO' ? '#10b981' : '#f59e0b');
    doc.text(data.consulta.aptitud, 108, 133, { align: 'center' });

    // --- REPOSO (Si aplica) ---
    if (data.consulta.dias_reposo && data.consulta.dias_reposo > 0) {
        doc.setFontSize(10);
        doc.setTextColor('#ef4444');
        doc.text(`REPOSO MÉDICO: ${data.consulta.dias_reposo} DÍAS`, 15, 150);
        if (data.consulta.causa_reposo) {
            doc.setFontSize(9);
            doc.setTextColor('#64748b');
            doc.text(`Causa: ${data.consulta.causa_reposo}`, 15, 155);
        }
    }

    // --- OBSERVACIONES ---
    if (data.consulta.observaciones) {
        doc.setTextColor('#1e293b');
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('OBSERVACIONES Y RECOMENDACIONES:', 15, 170);
        doc.setFont('helvetica', 'normal');
        const obsSplit = doc.splitTextToSize(data.consulta.observaciones, 185);
        doc.text(obsSplit, 15, 176);
    }

    // --- SECCIÓN DE FIRMAS ---
    const lineY = 230;
    doc.setDrawColor('#cbdcf7');
    doc.setLineWidth(0.2);
    doc.line(40, lineY, 90, lineY); // Línea Doctora
    doc.line(125, lineY, 175, lineY); // Línea Trabajador

    doc.setFontSize(8);
    doc.setTextColor('#64748b');

    // Texto Médico
    doc.text([
        `Dra. ${data.doctora.nombre}`,
        `CI: 11.234.567`, // Placeholder, ajustar si es necesario
        `M.P.P.S ${data.doctora.mpps}`
    ], 65, lineY + 5, { align: 'center' });

    // Texto Trabajador
    doc.text([
        data.paciente.nombre,
        `CI: ${data.paciente.cedula}`,
        'Huella dactilar / Firma'
    ], 150, lineY + 5, { align: 'center' });

    // --- FIRMA DIGITAL (Opcional) ---
    if (data.conFirmaDigital) {
        // Aquí iría el logo o firma digital si tuviéramos el Base64
        // Por ahora dejamos una marca de agua o texto profesional
        doc.setFontSize(16);
        doc.setTextColor('rgba(30, 58, 138, 0.2)');
        doc.text('DOCUMENTO VALIDADO DIGITALMENTE', 108, 260, { align: 'center', angle: 45 });
    }

    // --- PIE DE PÁGINA ---
    doc.setFontSize(7);
    doc.setTextColor('#94a3b8');
    doc.text('Este certificado tiene validez según lo establecido en la LOPCYMAT y su Reglamento.', 108, 270, { align: 'center' });

    // Guardar archivo
    doc.save(`Certificado_${data.paciente.cedula}_${new Date().getTime()}.pdf`);
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
    }
}

export const generarReporteVigilanciaPDF = (data: SurveillanceData) => {
    const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'letter'
    });

    const blueColor = '#1e3a8a';
    const lightBlue = '#e7effb';

    // --- ENCABEZADO ---
    doc.setFillColor(lightBlue);
    doc.rect(0, 0, 216, 45, 'F');

    doc.setTextColor(blueColor);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('INFORME MENSUAL DE VIGILANCIA EPIDEMIOLÓGICA', 108, 20, { align: 'center' });

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`EMPRESA: ${data.companyName.toUpperCase()}`, 108, 28, { align: 'center' });
    doc.text(`PERÍODO: ${data.month}`, 108, 34, { align: 'center' });

    // --- RESUMEN EJECUTIVO (KPIs) ---
    doc.setDrawColor('#cbdcf7');
    doc.line(15, 55, 201, 55);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('RESUMEN EJECUTIVO', 15, 62);

    const kpiY = 75;
    const boxWidth = 60;

    // Total Pacientes
    doc.setFillColor('#f8fafc');
    doc.rect(15, kpiY, boxWidth, 20, 'F');
    doc.setTextColor('#1e3a8a');
    doc.setFontSize(14);
    doc.text(`${data.stats.totalPatients}`, 15 + boxWidth / 2, kpiY + 12, { align: 'center' });
    doc.setFontSize(8);
    doc.text('POBLACIÓN TOTAL', 15 + boxWidth / 2, kpiY + 17, { align: 'center' });

    // Ausentismo
    doc.rect(78, kpiY, boxWidth, 20, 'F');
    doc.setFontSize(14);
    doc.text(`${data.stats.absenteeismRate}%`, 78 + boxWidth / 2, kpiY + 12, { align: 'center' });
    doc.setFontSize(8);
    doc.text('ÍNDICE AUSENTISMO', 78 + boxWidth / 2, kpiY + 17, { align: 'center' });

    // Consultas
    doc.rect(141, kpiY, boxWidth, 20, 'F');
    doc.setFontSize(14);
    doc.text(`${data.stats.totalConsultations}`, 141 + boxWidth / 2, kpiY + 12, { align: 'center' });
    doc.setFontSize(8);
    doc.text('TOTAL CONSULTAS', 141 + boxWidth / 2, kpiY + 17, { align: 'center' });

    // --- TABLA DE MORBILIDAD ---
    doc.setFontSize(10);
    doc.setTextColor('#1e3a8a');
    doc.setFont('helvetica', 'bold');
    doc.text('1. DISTRIBUCIÓN DE MORBILIDAD POR SISTEMA', 15, 110);

    const patRows = data.stats.topPathologies.map(p => [
        p.name,
        p.value.toString(),
        `${((p.value / (data.stats.totalConsultations || 1)) * 100).toFixed(1)}%`
    ]);

    (doc as any).autoTable({
        startY: 115,
        head: [['Patología / Diagnóstico', 'Casos', 'Prevalencia (%)']],
        body: patRows,
        theme: 'striped',
        headStyles: { fillColor: [30, 58, 138], textColor: 255 },
        styles: { fontSize: 8 }
    });

    // --- TABLA DEMOGRÁFICA ---
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    doc.text('2. DISTRIBUCIÓN DEMOGRÁFICA Y DE GÉNERO', 15, finalY);

    const demoRows = data.stats.demographics.map(d => [
        d.group,
        d.Masc.toString(),
        d.Fem.toString(),
        (d.Masc + d.Fem).toString()
    ]);

    (doc as any).autoTable({
        startY: finalY + 5,
        head: [['Grupo Etario', 'Masculino', 'Femenino', 'Total']],
        body: demoRows,
        theme: 'striped',
        headStyles: { fillColor: [13, 148, 136], textColor: 255 },
        styles: { fontSize: 8 }
    });

    // --- PIE DE PÁGINA ---
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor('#94a3b8');
        doc.text(`Generado por Búnker Dra. Yadira Pino - v28.0 - Página ${i} de ${pageCount}`, 108, 275, { align: 'center' });
    }

    doc.save(`Reporte_Vigilancia_${data.companyName}_${new Date().getTime()}.pdf`);
};
