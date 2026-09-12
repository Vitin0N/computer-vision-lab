'''
    Geral
    'negativo'
    'cinza'
'''

import cv2
import numpy as np

def negative_img(img, p1=None, p2=None, p3=None):
    '''
    Retornamos o inverso da imagem. Isso é retornado pois o valor maximo é 255
    Logo subtraindo 255 pelos os valores da img retorna a imagem negativado
    '''
    return 255 - img

def gray_scale_img(img, p1=None, p2=None, p3=None):
    return cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)