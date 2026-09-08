import os
import sys
import json
import pandas as pd

def get_sheet_names(file_path):
    try:
        xl = pd.ExcelFile(file_path)
        return xl.sheet_names
    except Exception as e:
        sys.stderr.write(f"Error reading sheets: {str(e)}\n")
        return []

def parse_excel_data(file_path, sheet_name=None):
    try:
        xl = pd.ExcelFile(file_path)
        sheets = xl.sheet_names
        
        if not sheets:
            return [], [], []
            
        if sheet_name not in sheets:
            # Heuristic to find default sheet
            if 'Main' in sheets:
                sheet_name = 'Main'
            elif 'Data' in sheets:
                sheet_name = 'Data'
            else:
                sheet_name = sheets[0]
                
        # Check if there is a 'Data' sheet to retrieve coordinates for the given sheet_name
        has_data_sheet = 'Data' in sheets
        df_coords = None
        if has_data_sheet and sheet_name != 'Data':
            df_data = pd.read_excel(xl, sheet_name='Data')
            # Look for report/sheet name column. Usually it is column index 3 (Unnamed: 3) or named 'Report Name'
            report_col = None
            for col in df_data.columns:
                col_str = df_data[col].astype(str).str.lower()
                if col_str.str.contains('report|name|exchanger').any():
                    report_col = col
                    break
            if report_col is None and len(df_data.columns) > 3:
                report_col = df_data.columns[3]
                
            if report_col is not None:
                # Filter rows matching sheet_name
                df_coords = df_data[df_data[report_col].astype(str).str.strip() == sheet_name]

        # Load the sheet with no header row to analyze headers manually
        df = pd.read_excel(xl, sheet_name=sheet_name, header=None)
        if df.empty:
            return [], [], []
            
        # Helper utilities for parsing
        def safe_float(val, default=0.0):
            try:
                f = float(val)
                return f if not pd.isna(f) else default
            except:
                return default

        def clean_val(val, nominal=2.11):
            if pd.isna(val):
                return nominal
            val_str = str(val).strip().lower()
            if val_str in ['ndd', 'no defect', 'no defect detected', 'nan', '']:
                return nominal
            try:
                return float(val)
            except:
                return nominal
            
        # Find column with keyword in first 10 rows or column with most numeric/NDD values
        best_col = None
        best_score = -1
        max_nums = -1
        best_unique = -1
        
        # We need to find the nominal column first to know nominal thickness if available
        nominal_col = None
        for col in df.columns:
            first_rows_str = df[col].iloc[:10].astype(str).str.lower()
            if first_rows_str.str.contains('nominal|design|original').any():
                nominal_col = col
                break

        for col in df.columns:
            # Search first 10 rows for keywords
            first_rows_str = df[col].iloc[:10].astype(str).str.lower()
            has_keyword = first_rows_str.str.contains('thickness|wall loss|observed|value|maximum|remaining|min|actual|measured').any()
            is_nominal = first_rows_str.str.contains('nominal|design|original').any()
            is_remaining = first_rows_str.str.contains('remaining|wall loss|observed|actual|measured|min|minimum|maximum|loss').any()
            
            # Count how many numerical or NDD values are in the column
            col_cleaned = df[col].astype(str).str.strip().str.lower()
            def is_valid_reading(x):
                if x in ['ndd', 'no defect', 'no defect detected', '']:
                    return True
                try:
                    float(x)
                    return True
                except:
                    return False
            nums = col_cleaned.apply(is_valid_reading).sum()
            
            # Count unique numeric values to avoid selecting constant/nominal columns when tie-breaking
            numeric_vals = pd.to_numeric(df[col], errors='coerce').dropna()
            num_unique = int(numeric_vals.nunique())
            
            # Determine score: prefer remaining over nominal
            if nums == 0:
                score = -1
            elif is_remaining:
                score = 10
            elif has_keyword and not is_nominal:
                score = 5
            elif has_keyword and is_nominal:
                score = 2
            else:
                score = 1
                
            # Select column with highest score
            # Tie-breaking logic: prefer columns with more unique values (more likely remaining thickness values)
            if score > best_score:
                best_score = score
                max_nums = nums
                best_unique = num_unique
                best_col = col
            elif score == best_score:
                if num_unique > best_unique:
                    best_unique = num_unique
                    max_nums = nums
                    best_col = col
                elif num_unique == best_unique and nums > max_nums:
                    max_nums = nums
                    best_col = col
                
        if best_col is None:
            return [], [], []
            
        # Determine nominal thickness from nominal_col or default
        nominal_thickness = 2.11
        if nominal_col is not None:
            for val in df[nominal_col]:
                f_val = safe_float(val, -1.0)
                if 0.5 <= f_val <= 15.0:
                    nominal_thickness = f_val
                    break
        
        if nominal_thickness == 2.11:
            for col in df.columns:
                first_rows_str = df[col].iloc[:10].astype(str).str.lower()
                if first_rows_str.str.contains('nominal|design|original|wt').any():
                    numeric_vals = pd.to_numeric(df[col], errors='coerce').dropna()
                    valid_noms = numeric_vals[(numeric_vals >= 0.5) & (numeric_vals <= 15.0)]
                    if not valid_noms.empty:
                        nominal_thickness = float(valid_noms.iloc[0])
                        break
        
        # Extract tubes coordinates and measurements
        tubes = []
        measurements = []
        
        # If we have filtered coordinates from 'Data' sheet
        if df_coords is not None and not df_coords.empty:
            # Find row, tube, thickness, report name columns in Data sheet
            row_col = None
            tube_col = None
            thick_col = None
            report_col = None
            nominal_col_coords = None
            
            for col in df_coords.columns:
                col_str = str(col).lower()
                first_val_str = str(df_coords[col].iloc[0]).lower() if not df_coords[col].empty else ""
                
                if 'row' in col_str or 'row' in first_val_str:
                    row_col = col
                elif 'tube' in col_str or 'tube' in first_val_str:
                    tube_col = col
                elif 'thickness' in col_str or 'thickness' in first_val_str or 'remaining' in col_str:
                    is_nom = 'nominal' in col_str or 'design' in col_str or 'original' in col_str or 'nominal' in first_val_str or 'design' in first_val_str
                    is_rem = 'remaining' in col_str or 'remaining' in first_val_str
                    
                    if thick_col is None:
                        thick_col = col
                    elif is_rem:
                        thick_col = col
                    elif not is_nom:
                        thick_col = col
                
                if 'report' in col_str or 'name' in col_str or 'exchanger' in col_str:
                    report_col = col
                elif 'nominal' in col_str or 'design' in col_str:
                    nominal_col_coords = col
            
            # Fallbacks based on typical column index positions:
            if row_col is None and len(df_coords.columns) > 4:
                row_col = df_coords.columns[4]
            if tube_col is None and len(df_coords.columns) > 5:
                tube_col = df_coords.columns[5]
            if thick_col is None and len(df_coords.columns) > 7:
                thick_col = df_coords.columns[7]
                
            if row_col is not None and tube_col is not None and thick_col is not None:
                for _, r in df_coords.iterrows():
                    nom_val = nominal_thickness
                    if nominal_col_coords is not None:
                        nom_val = safe_float(r[nominal_col_coords], nominal_thickness)
                        
                    val = clean_val(r[thick_col], nom_val)
                    row_val = pd.to_numeric(r[row_col], errors='coerce')
                    tube_val = pd.to_numeric(r[tube_col], errors='coerce')
                    if pd.notna(row_val) and pd.notna(tube_val):
                        tubes.append({
                            "thickness": float(val),
                            "row": int(row_val),
                            "tube": int(tube_val)
                        })
                        rep_val = sheet_name or "Unknown"
                        if report_col is not None:
                            val_str = str(r[report_col]).strip()
                            if val_str and val_str.lower() != 'nan':
                                rep_val = val_str
                        measurements.append({
                            "reportName": rep_val,
                            "rowNo": int(row_val),
                            "tubeNo": int(tube_val),
                            "nominalThickness": float(nom_val),
                            "remainingThickness": float(val)
                        })
                        
        # If no coordinates found from Data sheet, check if target sheet has Row/Tube columns
        if not tubes:
            row_col = None
            tube_col = None
            report_col = None
            nominal_col_sheet = None
            
            # Check first 5 rows for column headers
            for r_idx in range(min(5, len(df))):
                row_cells = df.iloc[r_idx].astype(str).str.lower()
                if row_cells.str.contains('row').any() and row_cells.str.contains('tube').any():
                    for col in df.columns:
                        val_str = str(df.iloc[r_idx, col]).lower()
                        if 'row' in val_str:
                            row_col = col
                        elif 'tube' in val_str:
                            tube_col = col
                        elif 'report' in val_str or 'name' in val_str or 'exchanger' in val_str:
                            report_col = col
                        elif 'nominal' in val_str:
                            nominal_col_sheet = col
                    break
            
            if row_col is not None and tube_col is not None:
                for idx, r in df.iterrows():
                    nom_val = nominal_thickness
                    if nominal_col_sheet is not None:
                        nom_val = safe_float(r[nominal_col_sheet], nominal_thickness)
                    
                    val = clean_val(r[best_col], nom_val)
                    row_val = pd.to_numeric(r[row_col], errors='coerce')
                    tube_val = pd.to_numeric(r[tube_col], errors='coerce')
                    if pd.notna(row_val) and pd.notna(tube_val):
                        tubes.append({
                            "thickness": float(val),
                            "row": int(row_val),
                            "tube": int(tube_val)
                        })
                        rep_val = sheet_name or "Unknown"
                        if report_col is not None:
                            val_str = str(r[report_col]).strip()
                            if val_str and val_str.lower() != 'nan':
                                rep_val = val_str
                        measurements.append({
                            "reportName": rep_val,
                            "rowNo": int(row_val),
                            "tubeNo": int(tube_val),
                            "nominalThickness": float(nom_val),
                            "remainingThickness": float(val)
                        })
                        
        # Extract values for AD test CSV — EXCLUDE NDD/no-defect readings
        # NDD tubes are kept in tubes[] for visualization but excluded from the
        # statistical values[] list. We only want actual measured thickness readings.
        values = []
        for idx, val in df[best_col].items():
            val_str = str(val).strip().lower()
            # Skip column header rows
            if 'thickness' in val_str or 'remaining' in val_str or 'nominal' in val_str or 'wall' in val_str:
                continue
            # Skip NDD / no defect detected — these are undetected defects, NOT valid measurements
            if val_str in ['ndd', 'no defect', 'no defect detected', 'nan', ''] or pd.isna(val):
                continue
            try:
                f = float(val)
                values.append(f)
            except:
                continue  # Skip non-numeric values

        if not tubes and values:
            for idx, val in enumerate(values):
                row_idx = idx // 20 + 1
                col_idx = idx % 20 + 1
                tubes.append({
                    "thickness": float(val),
                    "row": row_idx,
                    "tube": col_idx
                })
                measurements.append({
                    "reportName": sheet_name or "Unknown",
                    "rowNo": row_idx,
                    "tubeNo": col_idx,
                    "nominalThickness": nominal_thickness,
                    "remainingThickness": float(val)
                })
                
        # If tubes exists, sync values to represent the actual remaining thickness values list
        if tubes:
            defective_vals = [t["thickness"] for t in tubes if t["thickness"] < nominal_thickness - 0.001]
            values = defective_vals if defective_vals else [t["thickness"] for t in tubes]
                
        return values, tubes, measurements
    except Exception as e:
        sys.stderr.write(f"Error parsing sheet data: {str(e)}\n")
        return [], [], []

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Missing file path argument"}))
        sys.exit(1)
        
    file_path = sys.argv[1]
    
    if not os.path.exists(file_path):
        print(json.dumps({"error": f"File not found: {file_path}"}))
        sys.exit(1)
        
    action = sys.argv[2] if len(sys.argv) > 2 else "parse"
    
    if action == "list-sheets":
        sheets = get_sheet_names(file_path)
        print(json.dumps({"sheets": sheets}))
    else:
        sheet_name = sys.argv[3] if len(sys.argv) > 3 else None
        if sheet_name == "null" or sheet_name == "undefined":
            sheet_name = None
        values, tubes, measurements = parse_excel_data(file_path, sheet_name)
        print(json.dumps({"values": values, "tubes": tubes, "measurements": measurements}))

if __name__ == "__main__":
    main()
