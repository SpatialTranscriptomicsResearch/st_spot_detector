# ST Aligner

A web tool for automatic spot detection and positional adjustments for ST Datasets. 
The arrays used to generate ST Datasets may contain positional variations due to
printing artifacts. This web tool aims to detect correct spot positions using the HE image
with the overlay of the spots and then generate a file that can be used to adjust
the coordinates of ST data.

NOTE that this software is not fully functional yet as it is in an early stage of development. 

## Dependencies
The server uses Python 2.7 with the libraries OpenCV-Python and Pillow (PIL Fork) for image processing. These can easily be installed within a virtual environment using pip and requirements.txt (see Usage)
A modern browser with HTML5 support is required for the front-end interface. The web app has only been tested on the lastest version of Chrome.

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
3. Run the server
    ```
    chmod +x server.py
    ./server.py
    ```

### Client interface
1. Upload the desired Cy3 fluorescent image (takes a minute or two)
2. Drag the blue top left and orange bottom right corners onto the top left and bottom right spots to "frame" the spots
3. Click "Submit and detect" (will take another minute or two)
4. Spot adjustment:
  1. Move around the image with left-click and scroll-wheel to zoom.
  2. Select spots with right-click and move selected spots with left click, or delete them using the "Delete selected spots button".
  3. Add additional spots by clicking Add spots and right-clicking where they should be placed (left-click navigates around the image).
5. Export the spot values by clicking Export.

## License
MIT (see LICENSE).

## Authors
See AUTHORS. 

## Contact
Kim Wong <kim.wong@scilifelab.se>
Jose Fernandez <jose.fernandez.navarro@scilifelab.se>
