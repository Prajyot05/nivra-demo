import openpyxl

def dump_named_ranges(filepath):
    print("--- Named Ranges ---")
    wb = openpyxl.load_workbook(filepath, data_only=False)
    for dn in wb.defined_names.definedName:
        print(f"{dn.name} -> {dn.value}")

if __name__ == "__main__":
    try:
        dump_named_ranges("Nivra Goal - Compute SIP_or_StepUP_SIP v3.xlsm")
    except Exception as e:
        print(f"Error: {e}")
        # fallback for openpyxl defined_names
        wb = openpyxl.load_workbook("Nivra Goal - Compute SIP_or_StepUP_SIP v3.xlsm", data_only=False)
        for name in wb.defined_names:
            print(f"{name} -> {wb.defined_names[name].value}")
