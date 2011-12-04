MedDataVis Project - Visualize medical data

parse_json.py exports patient data in a d3-friendly format

parse.py: parse the physiologic data and output CSV files of temperature data

temp_sparkline.html: D3 script to display sparkline of temperature data

Steps to use:

1. Place parse.py in data folder

2. Create 'episodes' directory in data folder

3. Place temp_sparkline.html in episodes, along with d3 folder

4. Generate short data file using physiologic-all:
  head -n 2 physiologic-all.csv > physiologic-short.csv
  sed -i '1d' physiologic-short.csv

  This will generate a file with only one episode that can then be parsed
  by the parse.py script.

5. Run the parse.py script:
  python parse.py

  This will generate the CSV file of temperature data in the 'episodes' folder.

6. Run Python server in episodes to view spark line:
  python -m SimpleHTTPServer 8080

7. Open your browser to http://localhost:8080
