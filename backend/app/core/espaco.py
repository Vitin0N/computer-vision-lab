'''
# Espaciais
    'blur-gaussiano': 
    'media': 
    'mediana': 
    'max': 
    'min': 
'''
import cv2
import numpy as np

def gaussian_blur(img, p1, p2, p3):
    k_size = int(p1)
    kernel = k_size if k_size % 2 == 1 else k_size + 1

    result = cv2.GaussianBlur(img, (kernel, kernel), 0)

    return result

def media_blur(img, p1, p2, p3):
    k_size = int(p1)
    kernel = k_size if k_size % 2 == 1 else k_size + 1

    result = cv2.blur(img, (kernel, kernel))

    return result

def mediana_blur(img, p1, p2, p3):
    k_size = int(p1)
    kernel = k_size if k_size % 2 == 1 else k_size + 1

    result = cv2.medianBlur(img, kernel)

    return result

def erode(img, p1, p2, p3):
    k_size = int(p1)
    kernel_odd = k_size if k_size % 2 == 1 else k_size + 1

    kernel = np.ones((kernel_odd, kernel_odd), np.uint8)

    result = cv2.erode(img, kernel)

    return result

def dilate(img, p1, p2, p3):
    k_size = int(p1)
    kernel_odd = k_size if k_size % 2 == 1 else k_size + 1

    kernel = np.ones((kernel_odd, kernel_odd), np.uint8)

    result = cv2.dilate(img, kernel)

    return result

