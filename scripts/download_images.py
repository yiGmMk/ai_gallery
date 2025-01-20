import os
import re
import requests
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor


def clean_url(url):
    # Remove trailing backslash if present
    url = url.rstrip("\\")
    # Remove any additional path components after the file extension
    url = url.split("/webp")[0]
    return url


def is_image_url(url):
    # List of valid image extensions
    image_extensions = (".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg")
    return url.lower().endswith(image_extensions)


def download_image(url, save_dir, failed_downloads):
    try:
        # Clean the URL
        url = clean_url(url)

        # Skip non-image files
        if not is_image_url(url):
            print(f"Skipping non-image URL: {url}")
            return True

        # Extract filename from URL
        filename = url.split("/")[-1]
        save_path = os.path.join(save_dir, filename)

        # Skip if file already exists
        if os.path.exists(save_path):
            print(f"Skipping {filename} - already exists")
            return True

        # Download the image
        response = requests.get(url)
        response.raise_for_status()

        # Save the image
        with open(save_path, "wb") as f:
            f.write(response.content)
        print(f"Downloaded {filename}")
        return True

    except Exception as e:
        print(f"Error downloading {url}: {str(e)}")
        failed_downloads.append(url)
        return False


def analyze_urls(urls):
    # Clean and analyze URLs
    cleaned_urls = set()
    image_urls = set()
    non_image_urls = set()

    for url in urls:
        cleaned_url = clean_url(url)
        cleaned_urls.add(cleaned_url)

        if is_image_url(cleaned_url):
            image_urls.add(cleaned_url)
        else:
            non_image_urls.add(cleaned_url)

    print("\nURL Analysis:")
    print(f"Total raw URLs found: {len(urls)}")
    print(f"Unique URLs after cleaning: {len(cleaned_urls)}")
    print(f"Image URLs to download: {len(image_urls)}")
    if non_image_urls:
        print("\nNon-image URLs that will be skipped:")
        for url in sorted(non_image_urls):
            print(f"- {url}")

    return cleaned_urls


def main():
    # Create public directory if it doesn't exist
    save_dir = "public"
    os.makedirs(save_dir, exist_ok=True)

    # Regular expression pattern for the specific domain with optional line breaks
    pattern = r'https://slefboot-1251736664\.file\.myqcloud\.com/[^\s\'")\]\\]*(?:\s+[^\s\'")\]\\]+)*'

    # Set to store raw URLs and list for failed downloads
    raw_urls = set()
    failed_downloads = []

    # Walk through all files in the current directory
    for root, _, files in os.walk("."):
        for file in files:
            # Skip the public directory and node_modules if it exists
            if "node_modules" in root or "public" in root or ".git" in root:
                continue

            filepath = os.path.join(root, file)

            # Skip binary files and the script itself
            if (
                file.endswith((".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico"))
                or file == "download_images.py"
            ):
                continue

            try:
                # Read file content line by line
                with open(filepath, "r", encoding="utf-8") as f:
                    # Join lines to handle split URLs
                    content = ""
                    prev_line = ""
                    for line in f:
                        # If previous line ends with an underscore or hyphen, it might be a split URL
                        if prev_line.strip().endswith(("_", "-")):
                            content += prev_line.rstrip() + line
                        else:
                            content += prev_line
                        prev_line = line
                    content += prev_line  # Add the last line

                # Find all matching URLs and clean them
                matches = re.findall(pattern, content)
                # Clean up any whitespace in URLs
                cleaned_matches = [re.sub(r"\s+", "", match) for match in matches]
                raw_urls.update(cleaned_matches)

            except Exception as e:
                print(f"Error reading {filepath}: {str(e)}")

    # Analyze URLs and get cleaned image URLs
    urls = analyze_urls(raw_urls)

    # Download images using thread pool
    with ThreadPoolExecutor(max_workers=5) as executor:
        futures = [
            executor.submit(download_image, url, save_dir, failed_downloads)
            for url in urls
        ]
        # Wait for all downloads to complete
        for future in futures:
            future.result()

    # Print summary
    print("\nDownload Summary:")
    print(f"Total URLs found: {len(urls)}")
    print(f"Successfully downloaded: {len(urls) - len(failed_downloads)}")

    if failed_downloads:
        print(f"\nFailed downloads ({len(failed_downloads)}):")
        for url in failed_downloads:
            print(f"- {url}")
    print("\nall urls:")
    for url in urls:
        print(f"- {url}")


if __name__ == "__main__":
    main()
