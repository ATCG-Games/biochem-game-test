import urllib.request
import json

organs = ['Human_brain', 'Human_heart', 'Human_lung', 'Liver', 'Stomach', 'Kidney', 'Large_intestine']
base_url = "https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json&piprop=original&titles="

for organ in organs:
    url = base_url + organ
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        response = urllib.request.urlopen(req)
        data = json.loads(response.read().decode())
        pages = data['query']['pages']
        for page_id in pages:
            if 'original' in pages[page_id]:
                print(f"{organ}: {pages[page_id]['original']['source']}")
            else:
                print(f"{organ}: None")
    except Exception as e:
        print(f"Error fetching {organ}: {e}")
