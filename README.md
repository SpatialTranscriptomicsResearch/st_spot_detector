# ST Aligner

A web tool for automatic spot detection and positional adjustments for ST Datasets. 
The arrays used to generate ST Datasets may contain positional variations due to
printing artifacts. This web tool aims to detect correct spot positions using the HE image
with the overlay of the spots and then generate a file that can be used to adjust
the coordinates of ST data.

NOTE that this software is not fully functional yet as it is in an early stage of development. 

## Dependencies
The server uses Python 2.7 with the libraries OpenCV-Python and Pillow (PIL Fork) for image processing.
A modern browser with HTML5 support is required for the front-end interface.

## Usage
The server can be started by running the server.py script.
The web tool can then be interfaced by browsing to http://127.0.0.1:8081/index.html 
A HE image can be uploaded and will be processed by the server. Spot detection is currently very primitive.
The canvas can be moved around with the mouse and zoomed in and out by scrolling.
Spots can be adjusted by clicking on 'Select' and using the mouse to select the desired spots (hold in shift to add to the selection).
The selected spots can then be adjusted by clcking on 'Adjust' and using the arrow keys to shift their positions.
Spot data can then be exported by clicking on the 'Export' button at the top. The export file is however not currently usable.

## License
MIT (see LICENSE).

## Authors
See AUTHORS. 

## Contact
Kim Wong <kim.wong@scilifelab.se>
Jose Fernandez <jose.fernandez.navarro@scilifelab.se>
