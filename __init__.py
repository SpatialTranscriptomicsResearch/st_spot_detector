try:
    from .tissue_recognition import recognize_tissue, get_binary_mask,\
        downsample, upsample, free
except ImportError as ierr:
    print("Import error: %s" % ierr)
