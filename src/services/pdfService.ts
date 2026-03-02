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
            format: 'letter'
        });

        const pinkColor = '#e91e63';
        const blueColor = '#0284c7';
        const textColor = '#1e293b';

        // --- ENCABEZADO OFICIAL ---
        doc.setFillColor(233, 30, 99); // Rosa
        doc.setGState(new (doc as any).GState({ opacity: 0.1 }));
        doc.circle(180, 20, 15, 'F');
        doc.setFillColor(2, 132, 199); // Azul
        doc.circle(200, 35, 12, 'F');
        doc.setGState(new (doc as any).GState({ opacity: 1 }));

        doc.setTextColor(pinkColor);
        doc.setFont('times', 'italic');
        doc.setFontSize(26);
        doc.text(`Dra. ${data.doctora.nombre} R.`, 105, 25, { align: 'center' });

        doc.setTextColor(blueColor);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('Fisiatra / Medico Ocupacional', 105, 33, { align: 'center' });

        doc.setTextColor('#64748b');
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        const subtitulo = 'LOPCYMAT DIPLOMADO EN SALUD OCUPACIONAL DIPLOMADO DE ERGONOMIA';
        doc.text(subtitulo, 105, 38, { align: 'center' });
        doc.text(`C.I.: V-6.871.964 | M.P.PS: 41.171 | C.M.M: 13.012`, 105, 42, { align: 'center' });
        doc.text(`RIF: V-6871964-6 | INPSASEL: MIR116871964`, 105, 46, { align: 'center' });

        doc.setDrawColor(blueColor);
        doc.setLineWidth(0.5);
        doc.line(15, 50, 195, 50);

        doc.setTextColor(blueColor);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('CERTIFICADO DE APTITUD MÉDICA', 105, 60, { align: 'center' });

        doc.setTextColor(textColor);
        doc.setFontSize(11);
        const fecha = new Date().toLocaleDateString('es-VE', { day: 'numeric', month: 'long', year: 'numeric' });
        const ciudadActual = data.consulta.ciudad || 'Guarenas';
        doc.text(`En la ciudad de ${ciudadActual}, a los ${fecha}.`, 15, 75);

        doc.setFont('helvetica', 'bold');
        doc.text('HACE CONSTAR:', 15, 85);

        doc.setFont('helvetica', 'normal');
        const parrafo = `Que el ciudadano(a) ${data.paciente.nombre}, titular de la Cédula de Identidad N° ${data.paciente.cedula}, trabajador de la empresa ${data.empresa.nombre} (RIF: ${data.empresa.rif}), ha sido sometido a una evaluación médica ocupacional de tipo ${data.consulta.tipo.toLowerCase()}.`;

        const splitText = doc.splitTextToSize(parrafo, 180);
        doc.text(splitText, 15, 95);

        doc.setDrawColor(blueColor);
        doc.rect(15, 120, 186, 25);
        doc.setFont('helvetica', 'bold');
        doc.text('CONCLUSIÓN DE APTITUD:', 20, 127);
        doc.setFontSize(16);
        doc.setTextColor(data.consulta.aptitud === 'APTO' ? '#10b981' : '#f59e0b');
        doc.text(data.consulta.aptitud, 108, 137, { align: 'center' });

        let nextY = 160;
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
        }

        const lineY = 235;
        doc.setDrawColor(blueColor);
        doc.line(78, lineY, 138, lineY);

        doc.setFontSize(10);
        doc.setTextColor(textColor);
        doc.setFont('helvetica', 'bold');
        doc.text(`Dra. ${data.doctora.nombre} R.`, 108, lineY + 6, { align: 'center' });
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(`C.I.: V-6.871.964 | M.P.PS: 41.171 | C.M.M: 13.012`, 108, lineY + 11, { align: 'center' });
        doc.text(`INPSASEL: MIR116871964`, 108, lineY + 15, { align: 'center' });

        if (data.conFirmaDigital) {
            try {
                const img = await loadImage('/firma_doctora.png');
                doc.addImage(img, 'PNG', 86, lineY - 38, 45, 35);
            } catch (e) {
                console.error('Error firma:', e);
            }
        }

        doc.setTextColor(blueColor);
        doc.setFontSize(7);
        doc.text('Guarenas - Estadio Los Teques - Miranda | Tel: 0414-241.5697', 108, 265, { align: 'center' });

        doc.save(`Certificado_${data.paciente.cedula}.pdf`);
    } catch (err) {
        console.error('Error PDF Certificado:', err);
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
        genderChartImg?: string;
        ageChartImg?: string;
    };
    conFirmaDigital?: boolean;
}

export const generarReporteVigilanciaPDF = async (data: SurveillanceData) => {
    console.log('Generando Reporte Vigilancia Oficial...');
    try {
        const doc = new jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: 'letter'
        });

        const pinkColor = '#e91e63';
        const blueColor = '#0284c7';
        const textColor = '#1e293b';

        // --- ENCABEZADO OFICIAL ---
        doc.setFillColor(233, 30, 99); // Rosa
        doc.setGState(new (doc as any).GState({ opacity: 0.1 }));
        doc.circle(180, 20, 15, 'F');
        doc.setFillColor(2, 132, 199); // Azul
        doc.circle(200, 35, 12, 'F');
        doc.setGState(new (doc as any).GState({ opacity: 1 }));

        doc.setTextColor(pinkColor);
        doc.setFont('times', 'italic');
        doc.setFontSize(26);
        doc.text(`Dra. YADIRA PINO R.`, 105, 25, { align: 'center' });

        doc.setTextColor(blueColor);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('Fisiatra / Medico Ocupacional', 105, 33, { align: 'center' });

        doc.setTextColor('#64748b');
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        const subtitulo = 'LOPCYMAT DIPLOMADO EN SALUD OCUPACIONAL DIPLOMADO DE ERGONOMIA';
        doc.text(subtitulo, 105, 38, { align: 'center' });
        doc.text(`C.I.: V-6.871.964 | M.P.PS: 41.171 | C.M.M: 13.012`, 105, 42, { align: 'center' });
        doc.text(`RIF: V-6871964-6 | INPSASEL: MIR116871964`, 105, 46, { align: 'center' });

        doc.setDrawColor(blueColor);
        doc.setLineWidth(0.5);
        doc.line(15, 50, 195, 50);

        doc.setTextColor(blueColor);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('INFORME EPIDEMIOLÓGICO MENSUAL (LOPCYMAT)', 105, 58, { align: 'center' });

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(textColor);
        doc.text(`EMPRESA: ${data.companyName.toUpperCase()}`, 105, 65, { align: 'center' });
        doc.text(`PERÍODO: ${data.month}`, 105, 70, { align: 'center' });

        doc.setFillColor('#f8fafc');
        doc.rect(15, 80, 60, 22, 'F');
        doc.rect(78, 80, 60, 22, 'F');
        doc.rect(141, 80, 60, 22, 'F');

        doc.setTextColor(blueColor);
        doc.setFontSize(16);
        doc.text(`${data.stats.totalPatients}`, 45, 88, { align: 'center' });
        doc.text(`${data.stats.absenteeismRate}%`, 108, 88, { align: 'center' });
        doc.text(`${data.stats.totalConsultations}`, 171, 88, { align: 'center' });

        doc.setFontSize(8);
        doc.text('POBLACIÓN TOTAL', 45, 95, { align: 'center' });
        doc.text('ÍNDICE AUSENTISMO', 108, 95, { align: 'center' });
        doc.text('CONSULTAS TOTALES', 171, 95, { align: 'center' });

        autoTable(doc, {
            startY: 110,
            head: [['Morbilidad por Sistema', 'Casos', '%']],
            body: data.stats.topPathologies.map(p => [
                p.name,
                p.value,
                `${((p.value / (data.stats.totalConsultations || 1)) * 100).toFixed(1)}%`
            ]),
            theme: 'striped',
            headStyles: { fillColor: [233, 30, 99] }
        });

        const lastY = (doc as any).lastAutoTable.finalY + 15;
        autoTable(doc, {
            startY: lastY,
            head: [['Grupo Etario', 'M', 'F', 'T']],
            body: data.stats.demographics.map(d => [d.group, d.Masc, d.Fem, d.Masc + d.Fem]),
            theme: 'striped',
            headStyles: { fillColor: [2, 132, 199] }
        });

        let nextY = (doc as any).lastAutoTable.finalY + 10;
        if (nextY > 200) {
            doc.addPage();
            nextY = 20;
        }

        if (data.stats.genderChartImg) {
            doc.setFontSize(11);
            doc.setTextColor(blueColor);
            doc.setFont('helvetica', 'bold');
            doc.text('Distribución Visual de Población:', 15, nextY);
            doc.addImage(data.stats.genderChartImg, 'PNG', 15, nextY + 5, 80, 60);
        }

        if (data.stats.ageChartImg) {
            if (!data.stats.genderChartImg) {
                doc.setFontSize(11);
                doc.setTextColor(blueColor);
                doc.setFont('helvetica', 'bold');
                doc.text('Análisis de Morbilidad por Edad:', 15, nextY);
            }
            doc.addImage(data.stats.ageChartImg, 'PNG', 105, nextY + 5, 90, 60);
        }

        const finalY = (data.stats.genderChartImg || data.stats.ageChartImg)
            ? (nextY + 100 > 260 ? 260 : nextY + 100)
            : ((doc as any).lastAutoTable.finalY + 30);

        doc.setDrawColor(blueColor);
        doc.line(78, finalY, 138, finalY);

        doc.setFontSize(10);
        doc.setTextColor(textColor);
        doc.setFont('helvetica', 'bold');
        doc.text(`Dra. YADIRA PINO R.`, 108, finalY + 6, { align: 'center' });
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(`C.I.: V-6.871.964 | M.P.PS: 41.171 | C.M.M: 13.012`, 108, finalY + 11, { align: 'center' });
        doc.text(`INPSASEL: MIR116871964`, 108, finalY + 15, { align: 'center' });

        if (data.conFirmaDigital) {
            try {
                const img = await loadImage('/firma_doctora.png');
                doc.addImage(img, 'PNG', 86, finalY - 38, 45, 35);
            } catch (e) {
                console.error('Error firma:', e);
            }
        }

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
            format: 'letter'
        });

        const pinkColor = '#e91e63';
        const blueColor = '#0284c7';

        doc.setFillColor(233, 30, 99); // Rosa
        doc.setGState(new (doc as any).GState({ opacity: 0.1 }));
        doc.circle(240, 15, 12, 'F');
        doc.setFillColor(2, 132, 199); // Azul
        doc.circle(260, 25, 10, 'F');
        doc.setGState(new (doc as any).GState({ opacity: 1 }));

        doc.setTextColor(pinkColor);
        doc.setFont('times', 'italic');
        doc.setFontSize(22);
        doc.text(`Dra. YADIRA PINO R.`, 140, 15, { align: 'center' });

        doc.setTextColor(blueColor);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('Fisiatra / Medico Ocupacional | C.I. V-6.871.964 | MPPS 41171 | CMM 13012 | INPSASEL: MIR116871964', 140, 20, { align: 'center' });

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.text(`LISTADO DE EVALUACIONES MÉDICAS - ${companyName}`, 140, 28, { align: 'center' });

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
            headStyles: { fillColor: [2, 132, 199] }
        });

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
        ci: string;
        mpps: string;
        cmm: string;
        especialidad: string;
    };
}

export const generarReposoPDF = (data: ReposoData) => {
    const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'letter'
    });

    const pinkColor = '#e91e63';
    const blueColor = '#0284c7';
    const textColor = '#1e293b';

    doc.setFillColor(233, 30, 99); // Rosa
    doc.setGState(new (doc as any).GState({ opacity: 0.1 }));
    doc.circle(180, 20, 15, 'F');
    doc.setFillColor(2, 132, 199); // Azul
    doc.circle(200, 35, 12, 'F');
    doc.setGState(new (doc as any).GState({ opacity: 1 }));

    doc.setTextColor(pinkColor);
    doc.setFont('times', 'italic');
    doc.setFontSize(26);
    doc.text(`Dra. ${data.doctora.nombre} R.`, 105, 25, { align: 'center' });

    doc.setTextColor(blueColor);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Fisiatra / Medico Ocupacional', 105, 33, { align: 'center' });

    doc.setTextColor('#64748b');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const subtitulo = 'LOPCYMAT DIPLOMADO EN SALUD OCUPACIONAL DIPLOMADO DE ERGONOMIA';
    doc.text(subtitulo, 105, 38, { align: 'center' });
    doc.text(`C.I.: V-6.871.964 | M.P.PS: 41.171 | C.M.M: 13.012`, 105, 42, { align: 'center' });
    doc.text(`RIF: V-6871964-6 | INPSASEL: MIR116871964`, 105, 46, { align: 'center' });

    doc.setDrawColor(blueColor);
    doc.setLineWidth(0.5);
    doc.line(15, 50, 195, 50);

    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    if (data.reposo.tipo === 'REPOSO') {
        doc.setTextColor(pinkColor);
        doc.text('CONSTANCIA DE REPOSO', 105, 70, { align: 'center' });
    } else {
        doc.setTextColor(blueColor);
        doc.text('CONSTANCIA DE ASISTENCIA', 105, 70, { align: 'center' });
    }

    doc.setTextColor(textColor);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);

    let currentY = 85;
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

    doc.setTextColor(blueColor);
    doc.setFontSize(8);
    doc.text('0414-241.5697 0412-701.4041', 15, 250);
    doc.text('yadirapino6@gmail.com', 15, 255);
    doc.text('Calle acueducto con Av. Estadio número 2, sector el barbecho los teques Miranda', 15, 260);

    doc.setDrawColor(blueColor);
    doc.line(130, 250, 190, 250);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(textColor);
    doc.text('Firma y Sello Humedo', 145, 255);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(`Dra. ${data.doctora.nombre} R.`, 160, 260, { align: 'center' });
    doc.setFontSize(6);
    doc.text(`C.I. V-6.871.964 | MPPS 41171 | CMM 13012 | INPSASEL: MIR116871964`, 160, 264, { align: 'center' });

    doc.save(`Reposo_${data.paciente.cedula}.pdf`);
};
