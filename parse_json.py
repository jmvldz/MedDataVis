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
            variables_dict[variable_name] = []
        
        # Manipulates the timestamp to fit the UTC format
        timestamp = string.lstrip(timestamp, "3")
        split_timestamp = string.split(timestamp)
        split_timestamp.insert(1, "T")      # The "T" in between date and time
        split_timestamp.insert(0, "2")      # Set year to 2
        split_timestamp.append("Z")         # The "Z" for the timezone
        timestamp = string.join(split_timestamp, "")
        
        # Adds it to the variable dict
        variables_dict[variable_name].append(dict([("time", timestamp), ("value", variable_value)]))
  
    # Calculates the SF ratio
    sf_ratio = "SaO2 / FiO2"
    variables_dict[sf_ratio] = []
    for recordOne in variables_dict["FiO2"]:
      for recordTwo in variables_dict["SaO2 (monitor)"]:
        if recordOne["time"] == recordTwo["time"]:
          calculatedValue = float(recordTwo["value"]) / float(recordOne["value"])
          variables_dict[sf_ratio].append(dict([("time", recordOne["time"]), ("value", repr(calculatedValue))]))
      
    # Checking
    print variables_dict["FiO2"]
    print len(variables_dict)
    
    # Dumps it to a json
    json_dump = json.dumps(variables_dict, sort_keys=True, indent=4)
    # print type(json_dump)
    f = open('patient_data.json', 'w')
    f.write(json_dump)
    f.close()

def main():
    parse()

if __name__ == "__main__":
    main()

