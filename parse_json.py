#!/usr/bin/python

import csv
import string
import json

# Constants
data_file = 'physiologic-interventions.csv'

def parse():
    # Opens the physiological data file
    reader = csv.DictReader(open(data_file, 'r'))
    
    variables_dict = {} 

    # Iterates over the lines in the data file
    for record in reader:
        # Grabs values from record  # TODO: delete unnecessary
        variable_id = record["VariableID"]
        timestamp = record["Timestamp"]
        episode_id = record["EPISODEID"]
        variable_value = record["VariableValue"]
        min_after_admission = record["MinutesAfterAdmission"]
        variable_name = record["VariableName"]   
        
        # Initialization if variable has not been seen before
        if variable_name not in variables_dict:
            variables_dict[variable_name] = {}
            variables_dict[variable_name]["time"] = []
            variables_dict[variable_name]["value"] = []
        
        # Manipulates the timestamp to fit the UTC format
        split_timestamp = string.split(timestamp)
        split_timestamp.insert(1, "T")      # The "T" in between date and time
        split_timestamp.append("Z")         # The "Z" for the timezone
        timestamp = string.join(split_timestamp, "")
        
        # Adds it to the variable dict
        variables_dict[variable_name]["time"].append(timestamp)
        variables_dict[variable_name]["value"].append(variable_value)
    
    # Checking
    print variables_dict
    print len(variables_dict)
    
    # Dumps it to a json
    json_dump = json.dumps(variables_dict, sort_keys=True, indent=4)
    print type(json_dump)
    f = open('patient_data.json', 'w')
    f.write(json_dump)
    f.close()

def main():
    parse()

if __name__ == "__main__":
    main()

