#!/usr/bin/env python3
      #----------------------------------------------------------------------------
      # Created By  : khumnath cg<nath.khum@gmail.com>
      # Created Date: 24/10/2023
      # version ='1.0'
      # licence: GPL V3
import requests
from bs4 import BeautifulSoup

def scrape_nepali_words(urls, file_path):
    words = set()
    for url in urls:
        response = requests.get(url)
        soup = BeautifulSoup(response.content, 'html.parser')
        words.update(set(soup.get_text().split()))
    with open(file_path, 'w') as file:
        for word in words:
            if all(ord(c) >= 128 for c in word):
                file.write(word + '\n')

urls = ['https://ekantipur.com/entertainment', 'https://ekantipur.com/', 'https://nepalisahityaghar.com/', 'https://sahityapost.com/', 'https://ekantipur.com/']
file_path = 'nepali_words.txt'
scrape_nepali_words(urls, file_path)
