# ST Aligner

A web tool for automatic spot detection and positional adjustments for ST Datasets. 

The arrays used to generate ST Datasets may contain positional variations due to printing artifacts. This web tool aims to detect correct spot positions using the Cy3 using the Cy3 fluorescence image, and then generate a file that can be used to adjust the coordinates of ST data.

NOTE that this software is currently not yet fully functional and in an early stage of development. 

## Dependencies
The server uses Python 2.7 with the libraries OpenCV-Python and Pillow (PIL Fork) for image processing. These can easily be installed within a virtual environment using pip and requirements.txt (see Usage).
It also uses another [tissue recognition library](https://github.com/ludvb/tissue_recognition). 

A modern browser with HTML5 support is required for the front-end interface. The web app has been tested on the lastest version of Chrome and Firefox.

## Usage
### Server setup
1. Create and activate a Python virtual environment 

    ```
    pip install virtualenv
    virtualenv venv
    source venv/bin/activate
    ```
    
2. Install the dependencies in requirements.txt.

    ```
    pip install -r requirements.txt
    ```

3. Install the tissue recognition library
    Follow the instructions in https://github.com/ludvb/tissue_recognition

4. Run the server (make sure the python command uses Python 2, not Python 3)

    ```
    python server.py
    ```

### Client interface
1. Select the desired Cy3 fluorescent image to undergo spot detection and click "Upload Image" (takes a minute or two). An HE image may also be uploaded if desired; it is necessary that the two images have been previously aligned in Photoshop or similar. The images may be cropped, as long as the outer frame is totally intact, but they may not be scaled down.
2. Drag the lines to onto the outer "frame" of the spots, making sure that the lines intersect through approximately the middle of the spots.
  1. It is possible to navigate around the image with right-click and scroll-wheel to zoom.
3. Click "Detect Spots" (will take another minute or two)
4. Spot adjustment:
  1. Navigate around the image with right-click and scroll-wheel to zoom.
  2. Select spots with left-click (or Ctrl+click) and move selected spots with right click, or delete them using the "Delete selected spots" button.
  3. Add to the selection by pressing in shift and selecting additional spots.
  4. If the HE image has been uploaded, then spots within the tissue boundaries may automatically be selected by clicking on the "Select spots within tissue" button.
  4. Add additional spots by clicking the "Add Spots" button and then left-clicking where they should be placed (right-click and scroll-wheel navigates around the image).
  5. Return to the selection mode by clicking on the "Finish adding spots" button.
5. Export the spot values by clicking the "Export Spot Data" button. Either all the spots, or the current selection can be exported, in either adjusted array or pixel coordinates.

## License
MIT (see LICENSE).

## Authors
See AUTHORS. 

## Contact
Kim Wong <kim.wong@scilifelab.se>
Jose Fernandez <jose.fernandez.navarro@scilifelab.se>
