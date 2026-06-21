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
            return [], []
            
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
            return [], []
            
        # Find column with keyword in first 10 rows or column with most numeric values
        best_col = None
        max_nums = -1
        
        for col in df.columns:
            # Search first 10 rows for keywords
            first_rows_str = df[col].iloc[:10].astype(str).str.lower()
            has_keyword = first_rows_str.str.contains('thickness|wall loss|observed|value|maximum|remaining').any()
            
            # Count how many numerical values are in the column
            numeric_col = pd.to_numeric(df[col], errors='coerce')
            nums = numeric_col.notna().sum()
            
            if has_keyword and nums > max_nums:
                max_nums = nums
                best_col = col
            elif best_col is None or (nums > max_nums and max_nums < 5):
                max_nums = nums
                best_col = col
                
        if best_col is None:
            return [], []
            
        # Extract all numbers from best column
        series = pd.to_numeric(df[best_col], errors='coerce')
        values = series[series.notna()].tolist()
        
        # Extract tubes coordinates
        tubes = []
        
        # If we have filtered coordinates from 'Data' sheet
        if df_coords is not None and not df_coords.empty:
            # Find row, tube, thickness columns in Data sheet
            row_col = None
            tube_col = None
            thick_col = None
            
            for col in df_coords.columns:
                col_str = str(col).lower()
                first_val_str = str(df_coords[col].iloc[0]).lower() if not df_coords[col].empty else ""
                
                # Check column headers or first values for keywords
                if 'row' in col_str or 'row' in first_val_str:
                    row_col = col
                elif 'tube' in col_str or 'tube' in first_val_str:
                    tube_col = col
                elif 'thickness' in col_str or 'thickness' in first_val_str or 'remaining' in col_str:
                    thick_col = col
            
            # Fallbacks based on typical column index positions:
            # Row No is usually column 4, Tube No column 5, Thickness column 7
            if row_col is None and len(df_coords.columns) > 4:
                row_col = df_coords.columns[4]
            if tube_col is None and len(df_coords.columns) > 5:
                tube_col = df_coords.columns[5]
            if thick_col is None and len(df_coords.columns) > 7:
                thick_col = df_coords.columns[7]
                
            if row_col is not None and tube_col is not None and thick_col is not None:
                for _, r in df_coords.iterrows():
                    val = pd.to_numeric(r[thick_col], errors='coerce')
                    row_val = pd.to_numeric(r[row_col], errors='coerce')
                    tube_val = pd.to_numeric(r[tube_col], errors='coerce')
                    if pd.notna(val) and pd.notna(row_val) and pd.notna(tube_val):
                        tubes.append({
                            "thickness": float(val),
                            "row": int(row_val),
                            "tube": int(tube_val)
                        })
                        
        # If no coordinates found from Data sheet, check if target sheet has Row/Tube columns
        if not tubes:
            # Let's inspect the headers of the target sheet to see if there are columns named 'row' and 'tube'
            row_col = None
            tube_col = None
            
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
                    break
            
            if row_col is not None and tube_col is not None:
                for idx, r in df.iterrows():
                    val = pd.to_numeric(r[best_col], errors='coerce')
                    row_val = pd.to_numeric(r[row_col], errors='coerce')
                    tube_val = pd.to_numeric(r[tube_col], errors='coerce')
                    if pd.notna(val) and pd.notna(row_val) and pd.notna(tube_val):
                        tubes.append({
                            "thickness": float(val),
                            "row": int(row_val),
                            "tube": int(tube_val)
                        })
                        
        # If we still don't have tubes, create simple index-based fallback coordinates in a 20-column grid
        if not tubes and values:
            for idx, val in enumerate(values):
                row_idx = idx // 20 + 1
                col_idx = idx % 20 + 1
                tubes.append({
                    "thickness": float(val),
                    "row": row_idx,
                    "tube": col_idx
                })
                
        return values, tubes
    except Exception as e:
        sys.stderr.write(f"Error parsing sheet data: {str(e)}\n")
        return [], []

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
        values, tubes = parse_excel_data(file_path, sheet_name)
        print(json.dumps({"values": values, "tubes": tubes}))

if __name__ == "__main__":
    main()
