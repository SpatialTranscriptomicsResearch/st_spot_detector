'use strict';

// this directive is bound to the input button on the menu bar and is used
// to detect an image file being selected and converts the image to a string

angular.module('stSpots')
    .directive('imageUpload', [
        function() {
            var link = function(scope, elem, attrs) {
                var cy3File = angular.element(elem[0].querySelector('#cy3-upload-filename'));
                var cy3Input = angular.element(elem[0].querySelector('#cy3-upload'));

                // this is triggered when the state of the input button is changed;
                // e.g. it was empty but then a file has been selected
                cy3Input.bind('change', function(event) {
                    // checks that it hasn't gone from file to empty
                    if(event.target.files.length != 0) {
                        //cy3File.text(cy3Input.val());
                        cy3File.text(event.target.files[0].name);
                        var img = event.target.files[0];
                        var reader = new FileReader();

                        // function which runs after loading
                        reader.addEventListener('load', function() {
                            scope.$apply(function() {
                                scope.data.cy3Image = reader.result;
                            });
                        }, false);
                        if(img) {
                            reader.readAsDataURL(img);
                        }
                    }
                });
                /*
                // this is triggered when the state of the input button is changed;
                // e.g. it was empty but then a file has been selected
                cy3Input.bind('change', function(event) {
                    // checks that it hasn't gone from file to empty
                    if(event.target.files.length != 0) {
                        scope.$apply(
                            // $apply is required here because this function is executed
                            // outside of the normal AngularJS context, i.e. elem.bind()
                            scope.updateState('state_upload')
                        );
                        var img = event.target.files[0];
                        var reader = new FileReader();

                        // function which runs after loading
                        reader.addEventListener('load', function() {
                            scope.$apply(function() {
                                scope.data.image = reader.result;
                                scope.uploadImage();
                            });
                        }, false);
                        if(img) {
                            reader.readAsDataURL(img);
                        }
                    }
                });
                */
            };
            return {
                restrict: 'A',
                scope: false,
                link: link
            };
        }
    ]);

/*
    $('input:file').change(function ()
    {   // takes away C:\fakepath\file.doc //
        var filename = $(this).val();
        filename = filename.replace(/^.*\\/, "");
        $("#upload-filename").text(filename);

        myFile = this.files[0];
    });

    $('#upload-form').submit(function()
    {
        // does not do anything if no file selected //
        if(!(myFile == null))
        {
            var imageFileBlob = window.URL.createObjectURL(myFile);
            var sketch = Processing.getInstanceById('sketch');
            sketch.changeImage(imageFileBlob);
        }
        else
        {
            // no file selected! //
        }
    });
*/
