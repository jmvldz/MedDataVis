#!/usr/bin/python

import csv

# Constants
output_dir = 'episodes/'
data_file = 'physiologic-short.csv'

def parse():
  # Opens the physiological data file
  reader = csv.reader(open(data_file, 'r'))

  # Iterates over the lines in the data file
  records = 0
  for record in reader:
    # Gets the episode_id and the tuples in a record
    episode_id = record.pop(0)
    episode_records = [tuple(tuplestr.split('|')) for tuplestr in record]

    # Creates an output file
    output_file = output_dir + '%(id)s_temperature.csv' % {'id': episode_id}
    writer = csv.writer(open(output_file, 'wb'))

    # Create header line
    writer.writerow(['time', 'temp'])

    # Iterates over each tuple in the record
    for episode_record in episode_records:
      #if len(episode_record) > 1
      # Length of tuple is long enough and variable ID corresponds to temp
      if len(episode_record) > 1 and episode_record[2] == '12':
        # Writes to an output CSV
        writer.writerow([episode_record[0], episode_record[3]])
        #print episode_record[0], ',', episode_record[3]
        
    records += 1

    print "Episode ID: ", episode_id
    print "Number of records per episode: ", len(episode_records)

  print "Number of records: ", records

def main():
  parse()

if __name__ == "__main__":
  main()
