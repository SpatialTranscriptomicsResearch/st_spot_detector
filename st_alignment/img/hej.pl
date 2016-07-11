#!/usr/bin/perl

my $zoomOutLevel = 1;
my $photoWidth  = 20000;
my $photoHeight = 20000;
my $imageWidth  = 1024;
my $imageHeight = 1024;

my $tileMapWidth  = int(($photoWidth  / $zoomOutLevel) / $imageWidth)  + 1;
my $tileMapHeight = int(($photoHeight / $zoomOutLevel) / $imageHeight) + 1;

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

for my $y (0..$tileMapWidth - 1) {
    for my $x (0..$tileMapHeight - 1) {

        my $widthOffset  = $imageWidth  * $x;
        my $heightOffset = $imageHeight * $y;
        print("--\n");
        print("Processing tile " . $x . ", " . $y . "\n");

        my $imageFilename = "zoom${zoomOutLevel}_x${x}_y${y}.jpg";
        print(`stream -map rgb -storage-type char -extract ${imageWidth}x${imageHeight}+${widthOffset}+${heightOffset} $sourceFile tmp.dat`);
        print(`convert -depth 8 -size ${imageWidth}x${imageHeight} rgb:tmp.dat $imageFilename`);
        print("Finished processing, saved as $imageFilename\n");
    }
}

`rm tmp.dat`;
