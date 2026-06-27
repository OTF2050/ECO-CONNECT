import os
import time

def generate_municipality_pdf(report_id: int, report_title: str, reporter_name: str, category: str, severity: str, status: str, lat: float, lng: float, description: str, destination_dir: str):
    """
    Simulates a heavy report compilation task, running asynchronously to generate 
    a PDF report for the municipal office.
    """
    # Simulate heavy processing delay (e.g., retrieving satellite telemetry, rendering maps)
    time.sleep(4)
    
    os.makedirs(destination_dir, exist_ok=True)
    filename = f"municipal_report_{report_id}.pdf"
    filepath = os.path.join(destination_dir, filename)
    
    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.lib import colors
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        
        doc = SimpleDocTemplate(filepath, pagesize=letter, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
        story = []
        styles = getSampleStyleSheet()
        
        # Custom styles
        title_style = ParagraphStyle(
            'TitleStyle',
            parent=styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=22,
            textColor=colors.HexColor('#1b4d3e'), # Eco Green
            spaceAfter=15
        )
        
        body_style = ParagraphStyle(
            'BodyStyle',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=10.5,
            leading=15,
            textColor=colors.HexColor('#222222')
        )
        
        label_style = ParagraphStyle(
            'LabelStyle',
            fontName='Helvetica-Bold',
            fontSize=10,
            textColor=colors.HexColor('#d49a43') # Sand Gold
        )
        
        # Document Header
        story.append(Paragraph("ECO CONNECT - MUNICIPAL REPORT TICKET", title_style))
        story.append(Paragraph(f"Auto-generated on: {time.strftime('%Y-%m-%d %H:%M:%S')}", styles['Italic']))
        story.append(Spacer(1, 15))
        
        # Metadata Table
        data = [
            [Paragraph("Ticket reference:", label_style), Paragraph(f"MUNI-ECO-{report_id}", body_style)],
            [Paragraph("Reporter Name:", label_style), Paragraph(reporter_name, body_style)],
            [Paragraph("Issue Title:", label_style), Paragraph(report_title, body_style)],
            [Paragraph("Category:", label_style), Paragraph(category.upper(), body_style)],
            [Paragraph("Report Severity:", label_style), Paragraph(severity.upper(), body_style)],
            [Paragraph("GPS Coordinates:", label_style), Paragraph(f"Latitude: {lat} | Longitude: {lng}", body_style)],
            [Paragraph("Current Status:", label_style), Paragraph(status, body_style)]
        ]
        
        t = Table(data, colWidths=[150, 350])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f9f9f9')),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e0e0e0')),
            ('PADDING', (0,0), (-1,-1), 8),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ]))
        
        story.append(t)
        story.append(Spacer(1, 20))
        
        # Report Body
        story.append(Paragraph("<b>Detailed Incident Description:</b>", label_style))
        story.append(Spacer(1, 6))
        story.append(Paragraph(description, body_style))
        story.append(Spacer(1, 30))
        
        # Footer Seal
        story.append(Paragraph("<b>MUNICIPAL ENVIRONMENT REGULATOR SEAL</b>", label_style))
        story.append(Paragraph("Verified and catalogued into UAE Federal Sustainability Ledger.", styles['Italic']))
        
        doc.build(story)
        print(f"[Background Task] Asynchronously built PDF report: {filepath}")
        
    except ImportError:
        # Fallback structured TXT generation if reportlab is unavailable
        txt_filepath = filepath.replace(".pdf", ".txt")
        with open(txt_filepath, "w", encoding="utf-8") as f:
            f.write("========================================================\n")
            f.write("      ECO CONNECT - MUNICIPAL REPORT TICKET (MOCK PDF)  \n")
            f.write("========================================================\n")
            f.write(f"Generated at: {time.strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"Ticket ID: MUNI-ECO-{report_id}\n")
            f.write(f"Reporter Name: {reporter_name}\n")
            f.write(f"Issue Title: {report_title}\n")
            f.write(f"Category: {category.upper()}\n")
            f.write(f"Severity: {severity.upper()}\n")
            f.write(f"Coordinates: Lat {lat}, Lng {lng}\n")
            f.write(f"Status: {status}\n")
            f.write("--------------------------------------------------------\n")
            f.write("Description:\n")
            f.write(description + "\n")
            f.write("========================================================\n")
            f.write("MUNICIPAL ENVIRONMENT REGULATOR SEAL - SECURELY REGISTERED\n")
            f.write("========================================================\n")
        print(f"[Background Task] 'reportlab' not found. Built fallback text report: {txt_filepath}")
        # Rename file references to allow download checks
        if os.path.exists(filepath):
            os.remove(filepath)
        os.rename(txt_filepath, filepath)

def generate_subsidy_pdf(request_id: int, request_title: str, farmer_name: str, request_type: str, description: str, amount: float, status: str, destination_dir: str):
    """
    Asynchronously generates an official PDF Certificate for a farmer's governmental request.
    """
    time.sleep(3) # Simulate processing
    os.makedirs(destination_dir, exist_ok=True)
    filename = f"subsidy_certificate_{request_id}.pdf"
    filepath = os.path.join(destination_dir, filename)
    
    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.lib import colors
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        
        doc = SimpleDocTemplate(filepath, pagesize=letter, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
        story = []
        styles = getSampleStyleSheet()
        
        title_style = ParagraphStyle(
            'TitleStyle',
            parent=styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=20,
            textColor=colors.HexColor('#1b4d3e'), # Eco Green
            spaceAfter=15
        )
        
        body_style = ParagraphStyle(
            'BodyStyle',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=11,
            leading=16,
            textColor=colors.HexColor('#222222')
        )
        
        label_style = ParagraphStyle(
            'LabelStyle',
            fontName='Helvetica-Bold',
            fontSize=10,
            textColor=colors.HexColor('#d49a43') # Sand Gold
        )
        
        # Header
        story.append(Paragraph("OFFICIAL GOVERNMENT PERMIT & SUBSIDY CERTIFICATE", title_style))
        story.append(Paragraph("FEDERAL ENVIRONMENT & WATER REGULATION DEPT - UAE", styles['Italic']))
        story.append(Spacer(1, 15))
        
        # Details Table
        amount_str = f"{amount} AED" if amount is not None else "N/A (Non-Financial Permit)"
        data = [
            [Paragraph("Certificate Reference:", label_style), Paragraph(f"UAE-GOV-REQ-{request_id}", body_style)],
            [Paragraph("Beneficiary Farmer:", label_style), Paragraph(farmer_name, body_style)],
            [Paragraph("Request Type:", label_style), Paragraph(request_type.upper(), body_style)],
            [Paragraph("Grant/Permit Title:", label_style), Paragraph(request_title, body_style)],
            [Paragraph("Approved Value:", label_style), Paragraph(amount_str, body_style)],
            [Paragraph("Certificate Status:", label_style), Paragraph(f"<b>{status}</b>", body_style)],
            [Paragraph("Date of Issuance:", label_style), Paragraph(time.strftime('%Y-%m-%d'), body_style)]
        ]
        
        t = Table(data, colWidths=[150, 350])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f9fcfb')),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbe2db')),
            ('PADDING', (0,0), (-1,-1), 8),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ]))
        
        story.append(t)
        story.append(Spacer(1, 20))
        
        story.append(Paragraph("<b>Scope & Justification:</b>", label_style))
        story.append(Spacer(1, 6))
        story.append(Paragraph(description, body_style))
        story.append(Spacer(1, 25))
        
        # Signature
        story.append(Paragraph("<b>MINISTRY OF CLIMATE CHANGE & ENVIRONMENT SEAL</b>", label_style))
        story.append(Paragraph("This document certifies approval and allocation of state resources under Eco Connect ledger integration.", styles['Italic']))
        
        doc.build(story)
        print(f"[Background Task] Built official certificate PDF: {filepath}")
        
    except ImportError:
        # Fallback TXT
        txt_filepath = filepath.replace(".pdf", ".txt")
        with open(txt_filepath, "w", encoding="utf-8") as f:
            f.write("========================================================\n")
            f.write("    OFFICIAL GOVERNMENT PERMIT & SUBSIDY CERTIFICATE  \n")
            f.write("========================================================\n")
            f.write(f"Reference: UAE-GOV-REQ-{request_id}\n")
            f.write(f"Farmer Name: {farmer_name}\n")
            f.write(f"Request Type: {request_type.upper()}\n")
            f.write(f"Grant Title: {request_title}\n")
            f.write(f"Approved Value: {amount if amount is not None else 'N/A'}\n")
            f.write(f"Status: {status}\n")
            f.write(f"Date: {time.strftime('%Y-%m-%d')}\n")
            f.write("--------------------------------------------------------\n")
            f.write("Scope & Justification:\n")
            f.write(description + "\n")
            f.write("========================================================\n")
            f.write("MINISTRY OF CLIMATE CHANGE & ENVIRONMENT SEAL - REGISTERED\n")
            f.write("========================================================\n")
        print(f"[Background Task] reportlab missing. Fallback certificate: {txt_filepath}")
        if os.path.exists(filepath):
            os.remove(filepath)
        os.rename(txt_filepath, filepath)
