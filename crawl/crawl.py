import asyncio
import json
import time
import os
import random
from playwright.async_api import async_playwright, TimeoutError
from typing import List, Dict, Any
import aiofiles  # Cần pip install aiofiles

async def get_max_pages(page, base_url: str) -> int:
    url = f"{base_url}?page=1"
    for attempt in range(3):
        try:
            await page.goto(url, timeout=120000, wait_until="domcontentloaded")
            await page.wait_for_timeout(10000)
            pagination = await page.query_selector_all('ul.pagination li a')
            if pagination:
                last_page = 1
                for link in pagination:
                    href = await link.get_attribute('href') or ''
                    if 'page=' in href:
                        page_num = int(href.split('page=')[-1])
                        last_page = max(last_page, page_num)
                print(f"Tìm thấy {last_page} trang tối đa cho {base_url}")
                return last_page
            else:
                print(f"Không tìm thấy phân trang cho {base_url}, giả định chỉ có 1 trang")
                return 1
        except Exception as e:
            print(f"Thử {attempt + 1}/3 thất bại khi tìm số trang tối đa cho {base_url}: {e}")
            if attempt < 2:
                await asyncio.sleep(random.uniform(5, 10))
            else:
                print(f"Đã thử tối đa cho {base_url}, mặc định 1 trang")
                return 1

async def crawl_pages(page, base_url: str, max_pages: int) -> List[str]:
    category_urls = []
    for page_num in range(1, max_pages + 1):
        url = f"{base_url}?page={page_num}"
        print(f"Đang crawl trang {page_num}: {url} lúc {time.strftime('%H:%M:%S', time.localtime())}")
        for attempt in range(3):
            try:
                await page.goto(url, timeout=120000, wait_until="domcontentloaded")
                await page.wait_for_timeout(10000)
                categories = await page.query_selector_all('div.lc-col.lc-col-4.css-o0h841')
                print(f"Tìm thấy {len(categories)} danh mục trên trang {page_num}")
                for category in categories:
                    link = await category.query_selector('a.category-item-level-3-item')
                    if link:
                        href = await link.get_attribute('href')
                        if href and href.startswith('/'):
                            full_url = f"https://nhathuoclongchau.com.vn{href}"
                            category_urls.append(full_url)
                            print(f"Tìm thấy URL danh mục: {full_url}")
                break
            except Exception as e:
                print(f"Thử {attempt + 1}/3 thất bại cho trang {page_num}: {e}")
                if attempt < 2:
                    await asyncio.sleep(random.uniform(5, 10))
                else:
                    print(f"Đã thử tối đa cho trang {page_num}, bỏ qua")
    return category_urls

async def get_max_pages_category(page, category_url: str) -> int:
    return await get_max_pages(page, category_url)

async def crawl_category(page, category_url: str) -> List[str]:
    max_pages = await get_max_pages_category(page, category_url)
    product_urls = []
    for page_num in range(1, max_pages + 1):
        cat_page_url = category_url + (f"?page={page_num}" if "?" not in category_url else f"&page={page_num}")
        for attempt in range(3):
            try:
                await page.goto(cat_page_url, timeout=120000, wait_until="domcontentloaded")
                await page.wait_for_timeout(10000)
                await asyncio.sleep(random.uniform(5, 10))
                print(f"Đang crawl trang {page_num} của danh mục: {cat_page_url}")
                products = await page.query_selector_all('div.h-full.relative.flex.rounded-xl.border.border-solid')
                print(f"Tìm thấy {len(products)} sản phẩm trên trang {page_num} của danh mục {category_url}")
                for product in products:
                    link = await product.query_selector('a.px-3.block.pt-3')
                    if link:
                        href = await link.get_attribute('href')
                        if href and href.endswith('.html'):
                            full_url = f"https://nhathuoclongchau.com.vn{href}" if href.startswith('/') else href
                            product_urls.append(full_url)
                            print(f"Tìm thấy URL sản phẩm: {full_url}")
                break
            except Exception as e:
                print(f"Thử {attempt + 1}/3 thất bại cho trang {page_num} của danh mục {category_url}: {e}")
                if attempt < 2:
                    await asyncio.sleep(random.uniform(5, 10))
                else:
                    print(f"Đã thử tối đa cho trang {page_num} của danh mục {category_url}, bỏ qua")
    return product_urls

async def crawl_product_detail(browser, product_url: str, user_agents: List[str]) -> Dict[str, Any]:
    context = await browser.new_context(ignore_https_errors=True, user_agent=random.choice(user_agents))
    page = await context.new_page()
    try:
        full_info = {
            'url': product_url,
            'name': None,
            'price': None,
            'unit': None,
            'description': None,
            'manufacturer': None,
            'ingredients': None,
            'usage': None,
            'dosage': None,
            'storage': None,
            'contraindications': None,
            'sku': None,
            'specification': None,
            'adverseEffect': None,
            'registNum': None,
            'brand': None,
            'producer': None,
            'manufactor': None,
            'legalDeclaration': None,
            'category': None,
            'relatedProducts': None,
            'image': None,
            'rating': None,
            'review_count': None,
            'faq': None
        }
        for attempt in range(3):
            try:
                response = await page.goto(product_url, timeout=120000, wait_until="domcontentloaded")
                status = response.status if response else 0
                print(f"Trạng thái HTTP cho {product_url}: {status}")
                if status >= 400:
                    print(f"Sản phẩm {product_url} trả về lỗi {status}, trả về thông tin cơ bản")
                    return full_info
                await page.wait_for_timeout(10000)
                await asyncio.sleep(random.uniform(5, 10))
                next_data_script = await page.query_selector('script#__NEXT_DATA__')
                if next_data_script:
                    try:
                        next_data_text = await next_data_script.inner_text()
                        next_data = json.loads(next_data_text)
                        props = next_data.get('props', {}).get('pageProps', {})
                        product = props.get('product', {})
                        full_info.update({
                            'name': product.get('webName') or product.get('name'),
                            'price': product.get('prices', [{}])[0].get('price'),
                            'unit': product.get('prices', [{}])[0].get('measureUnitName'),
                            'description': product.get('shortDescription') or product.get('description'),
                            'manufacturer': product.get('producer'),
                            'ingredients': product.get('ingredient', []),
                            'usage': product.get('usage'),
                            'dosage': product.get('dosage'),
                            'storage': product.get('preservation'),
                            'contraindications': product.get('careful'),
                            'sku': product.get('sku'),
                            'specification': product.get('specification'),
                            'adverseEffect': product.get('adverseEffect'),
                            'registNum': product.get('registNum'),
                            'brand': product.get('brand'),
                            'producer': product.get('producer'),
                            'manufactor': product.get('manufactor'),
                            'legalDeclaration': product.get('legalDeclaration')
                        })
                        categories = product.get('categories', [])
                        if categories:
                            full_info['category'] = [cat.get('name') for cat in categories]
                        related = props.get('relatedProducts', [])
                        if related:
                            full_info['relatedProducts'] = [{'sku': r.get('sku'), 'name': r.get('name'), 'image': r.get('image')} for r in related]
                    except json.JSONDecodeError:
                        print(f"Lỗi phân tích __NEXT_DATA__ cho {product_url}")
                scripts = await page.query_selector_all('script[type="application/ld+json"]')
                for script in scripts:
                    try:
                        data_text = await script.inner_text()
                        data = json.loads(data_text)
                        if data.get('@type') == 'Product':
                            full_info.update({
                                'name': data.get('name'),
                                'price': data.get('offers', {}).get('price'),
                                'description': data.get('description'),
                                'image': data.get('image', [None])[0] if data.get('image') else None,
                                'rating': data.get('aggregateRating', {}).get('ratingValue'),
                                'review_count': data.get('aggregateRating', {}).get('reviewCount')
                            })
                        elif data.get('@type') == 'BreadcrumbList':
                            cats = [item.get('name') for item in data.get('itemListElement', []) if item.get('name')]
                            if cats:
                                full_info['category'] = cats
                        elif data.get('@type') == 'FAQPage':
                            faqs = [{'question': q.get('name'), 'answer': q.get('acceptedAnswer', {}).get('text')} for q in data.get('mainEntity', []) if q.get('name')]
                            if faqs:
                                full_info['faq'] = faqs
                    except json.JSONDecodeError:
                        continue
                if not full_info.get('image'):
                    img_elem = await page.query_selector('meta[property="og:image"]')
                    if img_elem:
                        content = await img_elem.get_attribute('content')
                        if content:
                            full_info['image'] = content
                print(f"Đã crawl sản phẩm: {full_info.get('name', 'Unknown')} từ {product_url}")
                return full_info
            except (TimeoutError, Exception) as e:
                print(f"Thử {attempt + 1}/3 thất bại cho sản phẩm {product_url}: {e}")
                if attempt < 2:
                    await asyncio.sleep(random.uniform(5, 10))
                else:
                    print(f"Đã thử tối đa cho sản phẩm {product_url}, trả về thông tin cơ bản")
                    return full_info
    finally:
        await context.close()

async def save_batch(products: List[Dict], filename: str):
    async with aiofiles.open(filename, 'a', encoding='utf-8') as f:
        for p in products:
            await f.write(json.dumps(p, ensure_ascii=False, indent=2) + '\n')
    print(f"Đã lưu {len(products)} sản phẩm vào {filename}")

async def main():
    output_file = 'all_products.jsonl'
    if os.path.exists(output_file):
        os.remove(output_file)
        print(f"Đã xóa file {output_file} cũ")

    semaphore = asyncio.Semaphore(4)
    user_agents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.96 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0'
    ]
    base_url = "https://nhathuoclongchau.com.vn/thuoc"

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True, args=['--disable-dev-shm-usage'])
        context = await browser.new_context(ignore_https_errors=True, user_agent=random.choice(user_agents))
        page = await context.new_page()

        max_pages_main = await get_max_pages(page, base_url)
        print(f"Bắt đầu crawl với {max_pages_main} trang chính")

        all_category_urls = set(await crawl_pages(page, base_url, max_pages_main))
        print(f"Tổng cộng {len(all_category_urls)} danh mục duy nhất")

        await context.close()

        for cat_url in all_category_urls:
            context = await browser.new_context(ignore_https_errors=True, user_agent=random.choice(user_agents))
            page = await context.new_page()
            product_urls = await crawl_category(page, cat_url)
            await context.close()
            if not product_urls:
                print(f"Không có sản phẩm trong danh mục {cat_url}, bỏ qua")
                continue
            tasks = []
            for prod_url in product_urls:
                async def crawl_with_sem(url):
                    async with semaphore:
                        return await crawl_product_detail(browser, url, user_agents)
                tasks.append(crawl_with_sem(prod_url))
            batch_products = await asyncio.gather(*tasks, return_exceptions=True)
            valid_products = [p for p in batch_products if isinstance(p, dict)]
            if valid_products:
                await save_batch(valid_products, output_file)

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())