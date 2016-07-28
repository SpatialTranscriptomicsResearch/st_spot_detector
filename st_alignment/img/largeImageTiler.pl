#!/usr/bin/perl

# this script scales down and/or tiles very large images.
# you will need to have ImageMagick's convert and stream tools to run it.
# $zoomOutLevel affects the size of the resultant image:
    # the size of the resultant image becomes the original width divided
    # by the zoom out level, rounded up to the closest tile map size
# $tileWidth and $tileHeight affect the tile size.

my $zoomOutLevel = 1;
my $photoWidth  = 20000;
my $photoHeight = 20000;
my $tileWidth  = 1024;
my $tileHeight = 1024;

my $tileMapWidth  = int(($photoWidth  / $zoomOutLevel) / $tileWidth)  + 1;
my $tileMapHeight = int(($photoHeight / $zoomOutLevel) / $tileHeight) + 1;

my $sourceFile = "giganticImage.jpg";

print("Working on zoom out level $zoomOutLevel. It has a tilemap size of $tileMapWidth, $tileMapHeight.\n");

if($zoomOutLevel != 1) {
    my $newPhotoWidth  = $photoWidth  / $zoomOutLevel;
    my $newPhotoHeight = $photoHeight / $zoomOutLevel;
    my $outputFile = "zoom${zoomOutLevel}_large.jpg";
    print("Creating and saving the large image file $outputFile\n");
    print(`convert -depth 8 -resize ${newPhotoWidth}x${newPhotoHeight} $sourceFile $outputFile`);
    $sourceFile = $outputFile;
}

for my $y (0..$tileMapHeight - 1) {
    for my $x (0..$tileMapWidth - 1) {

        my $widthOffset  = $tileWidth  * $x;
        my $heightOffset = $tileHeight * $y;
        print("--\n");
        print("Processing tile " . $x . ", " . $y . "\n");

        my $imageFilename = "zoom${zoomOutLevel}_x${x}_y${y}.jpg";
        print(`stream -map rgb -storage-type char -extract ${tileWidth}x${tileHeight}+${widthOffset}+${heightOffset} $sourceFile tmp.dat`);
        print(`convert -depth 8 -size ${tileWidth}x${tileHeight} rgb:tmp.dat $imageFilename`);
        print("Finished processing, saved as $imageFilename\n");
    }
}

`rm tmp.dat`;
